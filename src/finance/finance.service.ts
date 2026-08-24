import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyCode, FinanceEntryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FinanceCalculator } from './finance-calculator';
import {
  CreateContributionDto,
  CreateContributionPaymentDto,
  CreateFinanceExpenseDto,
  CreateFinanceFundDto,
  CreateFinanceIncomeDto,
  FinanceReportQueryDto,
  MyFinanceQueryDto,
} from './dto/finance.dto';

const activeMemberWhere = {
  status: 'ACTIVE' as const,
  archivedAt: null,
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  listFunds(choirId: string) {
    return this.prisma.financeFund.findMany({
      where: { choirId },
      orderBy: [{ currency: 'asc' }, { name: 'asc' }],
    });
  }

  createFund(choirId: string, dto: CreateFinanceFundDto) {
    return this.prisma.financeFund.create({
      data: {
        choirId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
        initialBalance: dto.initialBalance ?? 0,
      },
    });
  }

  listContributions(choirId: string) {
    return this.prisma.contribution.findMany({
      where: { choirId },
      include: {
        fund: true,
        _count: { select: { obligations: true, payments: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async createContribution(choirId: string, dto: CreateContributionDto) {
    const fund = await this.prisma.financeFund.findFirst({
      where: { id: dto.fundId, choirId, status: 'ACTIVE' },
    });
    if (!fund) throw new NotFoundException('Finance fund not found');
    if (fund.currency !== dto.currency) {
      throw new BadRequestException(
        'Contribution currency must match the fund currency',
      );
    }

    const targetType = dto.targetType || 'ALL_MEMBERS';
    const membershipIds = await this.resolveContributionMemberships(
      choirId,
      targetType,
      dto.membershipIds || [],
      dto.voiceSectionIds || [],
    );
    if (!membershipIds.length) {
      throw new BadRequestException('Contribution has no target members');
    }

    return this.prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          choirId,
          fundId: fund.id,
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          currency: dto.currency,
          frequency: dto.frequency,
          dueDate: new Date(dto.dueDate),
          targetType,
        },
      });

      if (targetType === 'MEMBERS' && dto.membershipIds?.length) {
        await tx.contributionTarget.createMany({
          data: dto.membershipIds.map((membershipId) => ({
            contributionId: contribution.id,
            membershipId,
          })),
        });
      }
      if (targetType === 'VOICE_SECTIONS' && dto.voiceSectionIds?.length) {
        await tx.contributionTarget.createMany({
          data: dto.voiceSectionIds.map((voiceSectionId) => ({
            contributionId: contribution.id,
            voiceSectionId,
          })),
        });
      }

      await tx.contributionObligation.createMany({
        data: [...new Set(membershipIds)].map((membershipId) => ({
          choirId,
          contributionId: contribution.id,
          membershipId,
          amount: dto.amount,
          currency: dto.currency,
          dueDate: new Date(dto.dueDate),
        })),
      });

      return tx.contribution.findUnique({
        where: { id: contribution.id },
        include: {
          fund: true,
          obligations: true,
          targets: true,
        },
      });
    });
  }

  async payContribution(
    choirId: string,
    actorMembershipId: string,
    dto: CreateContributionPaymentDto,
  ) {
    const obligation = await this.prisma.contributionObligation.findFirst({
      where: { id: dto.obligationId, choirId, cancelledAt: null },
      include: { contribution: true, payments: true },
    });
    if (!obligation)
      throw new NotFoundException('Contribution obligation not found');
    if (obligation.waivedAt) {
      throw new BadRequestException('This obligation is waived');
    }

    const alreadyPaid = FinanceCalculator.sum(
      obligation.payments
        .filter((payment) => payment.status === FinanceEntryStatus.VALIDATED)
        .map((payment) => payment.amount),
    );
    const remaining =
      FinanceCalculator.toNumber(obligation.amount) - alreadyPaid;
    if (dto.amount > remaining) {
      throw new BadRequestException('Payment exceeds remaining obligation');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.contributionPayment.create({
        data: {
          choirId,
          obligationId: obligation.id,
          contributionId: obligation.contributionId,
          fundId: obligation.contribution.fundId,
          membershipId: obligation.membershipId,
          amount: dto.amount,
          currency: obligation.currency,
          method: dto.method,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          validatedAt: new Date(),
          validatedByMembershipId: actorMembershipId,
          reference: dto.reference,
          notes: dto.notes,
        },
      });
      await tx.financeMovement.create({
        data: {
          choirId,
          fundId: payment.fundId,
          type: 'CONTRIBUTION_PAYMENT',
          amount: payment.amount,
          currency: payment.currency,
          sourceType: 'ContributionPayment',
          sourceId: payment.id,
          description: `Paiement cotisation ${obligation.contribution.title}`,
          occurredAt: payment.paidAt,
        },
      });
      return payment;
    });
  }

  async createIncome(
    choirId: string,
    actorMembershipId: string,
    dto: CreateFinanceIncomeDto,
  ) {
    const fund = await this.getFundOrThrow(choirId, dto.fundId, dto.currency);
    return this.prisma.$transaction(async (tx) => {
      const income = await tx.financeIncome.create({
        data: {
          choirId,
          fundId: fund.id,
          title: dto.title,
          category: dto.category,
          source: dto.source,
          description: dto.description,
          amount: dto.amount,
          currency: dto.currency,
          method: dto.method,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          proofUrl: dto.proofUrl,
          proofStorageKey: dto.proofStorageKey,
          validatedAt: new Date(),
          validatedByMembershipId: actorMembershipId,
        },
      });
      await tx.financeMovement.create({
        data: {
          choirId,
          fundId: fund.id,
          type: 'INCOME',
          amount: income.amount,
          currency: income.currency,
          sourceType: 'FinanceIncome',
          sourceId: income.id,
          description: income.title,
          occurredAt: income.receivedAt,
        },
      });
      return income;
    });
  }

  async createExpense(
    choirId: string,
    actorMembershipId: string,
    dto: CreateFinanceExpenseDto,
  ) {
    const fund = await this.getFundOrThrow(choirId, dto.fundId, dto.currency);
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.financeExpense.create({
        data: {
          choirId,
          fundId: fund.id,
          category: dto.category,
          beneficiary: dto.beneficiary,
          reason: dto.reason,
          amount: dto.amount,
          currency: dto.currency,
          method: dto.method,
          expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
          proofUrl: dto.proofUrl,
          proofStorageKey: dto.proofStorageKey,
          validatedAt: new Date(),
          validatedByMembershipId: actorMembershipId,
        },
      });
      await tx.financeMovement.create({
        data: {
          choirId,
          fundId: fund.id,
          type: 'EXPENSE',
          amount: Number(expense.amount) * -1,
          currency: expense.currency,
          sourceType: 'FinanceExpense',
          sourceId: expense.id,
          description: expense.reason,
          occurredAt: expense.expenseDate,
        },
      });
      return expense;
    });
  }

  async mySituation(userId: string, query: MyFinanceQueryDto) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        ...activeMemberWhere,
        ...(query.choirId ? { choirId: query.choirId } : {}),
      },
      include: {
        choir: { select: { id: true, name: true, slug: true } },
        contributionObligations: {
          where: { cancelledAt: null },
          include: { contribution: true, payments: true },
          orderBy: { dueDate: 'desc' },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      data: memberships.map((membership) => {
        const obligations = membership.contributionObligations.map(
          (obligation) => this.obligationSituation(obligation),
        );
        return {
          choir: membership.choir,
          membershipId: membership.id,
          totals: this.totalsByCurrency(obligations),
          obligations,
        };
      }),
    };
  }

  async report(choirId: string, query: FinanceReportQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const funds = await this.prisma.financeFund.findMany({
      where: {
        choirId,
        ...(query.fundId ? { id: query.fundId } : {}),
        ...(query.currency ? { currency: query.currency } : {}),
      },
      orderBy: [{ currency: 'asc' }, { name: 'asc' }],
    });
    const reports = [];
    for (const fund of funds) {
      const movements = await this.prisma.financeMovement.findMany({
        where: {
          choirId,
          fundId: fund.id,
          cancelledAt: null,
          occurredAt: { lte: endDate },
        },
        orderBy: { occurredAt: 'asc' },
      });
      const beforePeriod = startDate
        ? movements.filter((movement) => movement.occurredAt < startDate)
        : [];
      const inPeriod = movements.filter((movement) => {
        if (startDate && movement.occurredAt < startDate) return false;
        return movement.occurredAt <= endDate;
      });
      reports.push(FinanceCalculator.fundReport(fund, beforePeriod, inPeriod));
    }

    return {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate.toISOString(),
      },
      warning:
        'Les devises sont présentées séparément. Aucun solde CDF/USD n’est fusionné sans conversion explicite.',
      funds: reports,
    };
  }

  private async getFundOrThrow(
    choirId: string,
    fundId: string,
    currency: CurrencyCode,
  ) {
    const fund = await this.prisma.financeFund.findFirst({
      where: { id: fundId, choirId, status: 'ACTIVE' },
    });
    if (!fund) throw new NotFoundException('Finance fund not found');
    if (fund.currency !== currency) {
      throw new BadRequestException(
        'Operation currency must match fund currency',
      );
    }
    return fund;
  }

  private async resolveContributionMemberships(
    choirId: string,
    targetType: string,
    membershipIds: string[],
    voiceSectionIds: string[],
  ) {
    if (targetType === 'ALL_MEMBERS') {
      return (
        await this.prisma.membership.findMany({
          where: { choirId, ...activeMemberWhere },
          select: { id: true },
        })
      ).map((membership) => membership.id);
    }

    if (targetType === 'MEMBERS') {
      if (!membershipIds.length) {
        throw new BadRequestException('membershipIds are required');
      }
      const rows = await this.prisma.membership.findMany({
        where: { id: { in: membershipIds }, choirId, ...activeMemberWhere },
        select: { id: true },
      });
      if (rows.length !== new Set(membershipIds).size) {
        throw new NotFoundException('One or more members were not found');
      }
      return rows.map((membership) => membership.id);
    }

    if (targetType === 'VOICE_SECTIONS') {
      if (!voiceSectionIds.length) {
        throw new BadRequestException('voiceSectionIds are required');
      }
      const sectionCount = await this.prisma.voiceSection.count({
        where: { id: { in: voiceSectionIds }, choirId },
      });
      if (sectionCount !== new Set(voiceSectionIds).size) {
        throw new NotFoundException(
          'One or more voice sections were not found',
        );
      }
      return (
        await this.prisma.membership.findMany({
          where: {
            choirId,
            ...activeMemberWhere,
            profile: { is: { voiceSectionId: { in: voiceSectionIds } } },
          },
          select: { id: true },
        })
      ).map((membership) => membership.id);
    }

    throw new BadRequestException('Unsupported target type');
  }

  private obligationSituation(
    obligation: Prisma.ContributionObligationGetPayload<{
      include: { contribution: true; payments: true };
    }>,
  ) {
    const paid = FinanceCalculator.sum(
      obligation.payments
        .filter((payment) => payment.status === FinanceEntryStatus.VALIDATED)
        .map((payment) => payment.amount),
    );
    const due = FinanceCalculator.toNumber(obligation.amount);
    const remaining = Math.max(0, Math.round((due - paid) * 100) / 100);
    return {
      obligationId: obligation.id,
      contributionId: obligation.contributionId,
      title: obligation.contribution.title,
      dueDate: obligation.dueDate,
      currency: obligation.currency,
      due,
      paid,
      remaining,
      overdue: remaining > 0 && obligation.dueDate < new Date(),
    };
  }

  private totalsByCurrency(
    obligations: ReturnType<FinanceService['obligationSituation']>[],
  ) {
    const grouped = new Map<
      CurrencyCode,
      { currency: CurrencyCode; due: number; paid: number; remaining: number }
    >();
    for (const obligation of obligations) {
      const current = grouped.get(obligation.currency) || {
        currency: obligation.currency,
        due: 0,
        paid: 0,
        remaining: 0,
      };
      current.due += obligation.due;
      current.paid += obligation.paid;
      current.remaining += obligation.remaining;
      grouped.set(obligation.currency, current);
    }
    return [...grouped.values()].map((total) => ({
      ...total,
      due: Math.round(total.due * 100) / 100,
      paid: Math.round(total.paid * 100) / 100,
      remaining: Math.round(total.remaining * 100) / 100,
      recoveryRate: total.due
        ? Math.round((total.paid / total.due) * 10000) / 10000
        : 0,
    }));
  }
}
