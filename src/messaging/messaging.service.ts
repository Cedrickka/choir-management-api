import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMessagingTemplateDto,
  SendWhatsappDto,
} from './dto/messaging.dto';
import { MockMessagingProvider } from './messaging.provider';

@Injectable()
export class MessagingService {
  private readonly provider = new MockMessagingProvider();

  constructor(private readonly prisma: PrismaService) {}

  listTemplates(choirId: string) {
    return this.prisma.messagingTemplate.findMany({
      where: { choirId },
      orderBy: { name: 'asc' },
    });
  }

  createTemplate(choirId: string, dto: CreateMessagingTemplateDto) {
    return this.prisma.messagingTemplate.create({
      data: {
        choirId,
        name: dto.name,
        provider: dto.provider || 'MOCK',
        providerTemplateName: dto.providerTemplateName,
        language: dto.language || 'fr',
        variables: dto.variables || [],
        body: dto.body,
      },
    });
  }

  listAttempts(choirId: string) {
    return this.prisma.messagingAttempt.findMany({
      where: { choirId },
      include: {
        membership: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendWhatsapp(choirId: string, dto: SendWhatsappDto) {
    const existing = await this.prisma.messagingAttempt.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) return existing;

    const membership = await this.prisma.membership.findFirst({
      where: { id: dto.membershipId, choirId, archivedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        profile: true,
      },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (!membership.user.phone) throw new BadRequestException('Member has no phone number');
    if (!membership.profile?.whatsappConsentAt) {
      throw new BadRequestException('Member has not consented to WhatsApp messages');
    }

    const template = dto.templateId
      ? await this.prisma.messagingTemplate.findFirst({
          where: { id: dto.templateId, choirId, active: true },
        })
      : null;
    if (dto.templateId && !template) throw new NotFoundException('Messaging template not found');

    const variables = dto.variables || {};
    const body = template
      ? this.renderTemplate(template.body, template.variables, variables)
      : dto.body;
    if (!body) throw new BadRequestException('Message body is required');

    const attempt = await this.prisma.messagingAttempt.create({
      data: {
        choirId,
        membershipId: membership.id,
        templateId: template?.id,
        channel: 'WHATSAPP',
        provider: template?.provider || 'MOCK',
        to: membership.user.phone,
        title: dto.title,
        body,
        variables,
        idempotencyKey: dto.idempotencyKey,
        costCredits: 1,
      },
    });

    try {
      const result = await this.provider.sendWhatsapp({
        to: membership.user.phone,
        body,
        idempotencyKey: dto.idempotencyKey,
      });
      return this.prisma.messagingAttempt.update({
        where: { id: attempt.id },
        data: {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      return this.prisma.messagingAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Provider failure',
        },
      });
    }
  }

  private renderTemplate(
    body: string,
    requiredVariables: string[],
    variables: Record<string, string | number | boolean>,
  ) {
    for (const variable of requiredVariables) {
      if (variables[variable] === undefined || variables[variable] === null) {
        throw new BadRequestException(`Missing template variable: ${variable}`);
      }
    }
    return requiredVariables.reduce(
      (result, variable) =>
        result.replaceAll(`{${variable}}`, String(variables[variable])),
      body,
    );
  }
}
