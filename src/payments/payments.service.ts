import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FinanceEntryStatus,
  FinancePaymentMethod,
  PaymentProviderType,
  PaymentTransactionStatus,
  Prisma,
} from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import {
  CreatePaymentTransactionDto,
  PaymentWebhookDto,
} from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  listTransactions(choirId: string) {
    return this.prisma.paymentTransaction.findMany({
      where: { choirId },
      include: { allocations: { include: { obligation: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(
    choirId: string,
    actorMembershipId: string,
    dto: CreatePaymentTransactionDto,
  ) {
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { allocations: true },
    });
    if (existing) return existing;
    if (!dto.allocations.length) {
      throw new BadRequestException('At least one allocation is required');
    }

    const obligations = await this.prisma.contributionObligation.findMany({
      where: {
        id: { in: dto.allocations.map((allocation) => allocation.obligationId) },
        choirId,
        cancelledAt: null,
      },
      include: { contribution: true, payments: true },
    });
    if (obligations.length !== new Set(dto.allocations.map((x) => x.obligationId)).size) {
      throw new NotFoundException('One or more obligations were not found');
    }

    const allocationByObligation = new Map(
      dto.allocations.map((allocation) => [allocation.obligationId, allocation.amount]),
    );
    let total = 0;
    for (const obligation of obligations) {
      if (obligation.waivedAt) throw new BadRequestException('A target obligation is waived');
      if (obligation.currency !== dto.currency) {
        throw new BadRequestException('All obligations must use the transaction currency');
      }
      const amount = allocationByObligation.get(obligation.id) || 0;
      total += amount;
      const remaining = this.remainingAmount(obligation);
      if (amount > remaining) {
        throw new BadRequestException('Payment allocation exceeds remaining obligation');
      }
    }

    const internalReference = `pay_${Date.now()}_${randomUUID()}`;
    return this.prisma.paymentTransaction.create({
      data: {
        choirId,
        provider: dto.provider,
        internalReference,
        amount: this.round(total),
        currency: dto.currency,
        idempotencyKey: dto.idempotencyKey,
        payerMembershipId: dto.payerMembershipId || actorMembershipId,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        allocations: {
          create: dto.allocations.map((allocation) => ({
            obligationId: allocation.obligationId,
            amount: allocation.amount,
          })),
        },
      },
      include: { allocations: true },
    });
  }

  async handleWebhook(
    provider: PaymentProviderType,
    dto: PaymentWebhookDto,
    signature?: string,
  ) {
    const signatureValid = this.verifySignature(dto, signature);
    const existingEvent = await this.prisma.paymentWebhookEvent.findUnique({
      where: { provider_eventId: { provider, eventId: dto.eventId } },
      include: { transaction: true },
    });
    if (existingEvent) {
      return {
        duplicate: true,
        processedAt: existingEvent.processedAt,
        transactionId: existingEvent.transactionId,
      };
    }
    if (!signatureValid) {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider,
          eventId: dto.eventId,
          signatureValid: false,
          payload: dto as unknown as Prisma.InputJsonValue,
        },
      });
      throw new BadRequestException('Invalid payment webhook signature');
    }

    const transaction = await this.findTransaction(provider, dto);
    if (!transaction) throw new NotFoundException('Payment transaction not found');

    const event = await this.prisma.paymentWebhookEvent.create({
      data: {
        provider,
        eventId: dto.eventId,
        signatureValid,
        payload: dto as unknown as Prisma.InputJsonValue,
        choirId: transaction.choirId,
        transactionId: transaction.id,
      },
    });

    if (dto.status === PaymentTransactionStatus.SUCCEEDED) {
      await this.markSucceeded(transaction.id, dto.providerReference);
    } else if (
      dto.status === PaymentTransactionStatus.FAILED ||
      dto.status === PaymentTransactionStatus.CANCELLED
    ) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: dto.status,
          providerReference: dto.providerReference,
          failedAt: new Date(),
          failureReason: dto.failureReason,
          metadata: (dto.metadata || transaction.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } else {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: dto.status,
          providerReference: dto.providerReference,
          metadata: (dto.metadata || transaction.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    }

    await this.prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return { duplicate: false, transactionId: transaction.id, status: dto.status };
  }

  async markSucceeded(transactionId: string, providerReference?: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        allocations: {
          include: {
            obligation: { include: { contribution: true, payments: true } },
            contributionPayment: true,
          },
        },
      },
    });
    if (!transaction) throw new NotFoundException('Payment transaction not found');
    if (transaction.status === PaymentTransactionStatus.SUCCEEDED) return transaction;

    return this.prisma.$transaction(async (tx) => {
      for (const allocation of transaction.allocations) {
        if (allocation.contributionPaymentId) continue;
        const remaining = this.remainingAmount(allocation.obligation);
        const amount = this.round(Number(allocation.amount));
        if (amount > remaining) {
          await tx.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              failureReason: 'Payment allocation exceeds remaining obligation at webhook time',
            },
          });
          throw new BadRequestException('Payment no longer matches remaining debt');
        }
        const payment = await tx.contributionPayment.create({
          data: {
            choirId: transaction.choirId,
            obligationId: allocation.obligationId,
            contributionId: allocation.obligation.contributionId,
            fundId: allocation.obligation.contribution.fundId,
            membershipId: allocation.obligation.membershipId,
            amount,
            currency: transaction.currency,
            method: this.methodForProvider(transaction.provider),
            paidAt: new Date(),
            validatedAt: new Date(),
            reference: providerReference || transaction.internalReference,
            notes: `Paiement digital ${transaction.provider}`,
            paymentTransactionId: transaction.id,
          },
        });
        await tx.paymentAllocation.update({
          where: { id: allocation.id },
          data: { contributionPaymentId: payment.id },
        });
        await tx.financeMovement.create({
          data: {
            choirId: transaction.choirId,
            fundId: payment.fundId,
            type: 'CONTRIBUTION_PAYMENT',
            amount: payment.amount,
            currency: payment.currency,
            sourceType: 'ContributionPayment',
            sourceId: payment.id,
            description: `Paiement digital ${transaction.internalReference}`,
            occurredAt: payment.paidAt,
          },
        });
      }
      return tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCEEDED',
          providerReference,
          confirmedAt: new Date(),
        },
        include: { allocations: true },
      });
    });
  }

  private async findTransaction(provider: PaymentProviderType, dto: PaymentWebhookDto) {
    if (dto.internalReference) {
      return this.prisma.paymentTransaction.findUnique({
        where: { internalReference: dto.internalReference },
      });
    }
    if (dto.providerReference) {
      return this.prisma.paymentTransaction.findFirst({
        where: { provider, providerReference: dto.providerReference },
      });
    }
    return null;
  }

  private verifySignature(payload: PaymentWebhookDto, signature?: string) {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) return this.config.get('NODE_ENV') !== 'production';
    if (!signature) return false;
    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    const received = signature.replace(/^sha256=/, '');
    if (expected.length !== received.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  private remainingAmount(
    obligation: {
      amount: Prisma.Decimal | number;
      payments: { amount: Prisma.Decimal | number; status: FinanceEntryStatus }[];
    },
  ) {
    const paid = obligation.payments
      .filter((payment) => payment.status === FinanceEntryStatus.VALIDATED)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return this.round(Number(obligation.amount) - paid);
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private methodForProvider(provider: PaymentProviderType) {
    if (provider === 'CARD') return FinancePaymentMethod.CARD;
    if (provider === 'BANK') return FinancePaymentMethod.BANK_TRANSFER;
    if (provider === 'MOBILE_MONEY' || provider === 'MOCK') {
      return FinancePaymentMethod.MOBILE_MONEY;
    }
    return FinancePaymentMethod.OTHER;
  }
}
