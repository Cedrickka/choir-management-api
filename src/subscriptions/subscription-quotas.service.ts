import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type PlanQuotas = {
  members?: number;
  storageGb?: number;
  whatsappCredits?: number;
};

@Injectable()
export class SubscriptionQuotasService {
  constructor(private readonly prisma: PrismaService) {}

  async enforceMemberLimit(choirId: string) {
    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: { in: ['TRIALING', 'ACTIVE'] } },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    const subscription = choir?.organization.subscriptions[0];
    if (!subscription) return;

    const quotas = subscription.plan.quotas as PlanQuotas;
    const memberLimit = quotas.members;
    if (!memberLimit || memberLimit < 1) return;

    const currentMembers = await this.prisma.membership.count({
      where: { choirId, archivedAt: null, status: 'ACTIVE' },
    });
    if (currentMembers >= memberLimit) {
      throw new BadRequestException(
        `Member quota reached for ${subscription.plan.code} plan`,
      );
    }
  }
}
