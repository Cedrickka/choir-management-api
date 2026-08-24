import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionPlanCode } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  async getForChoir(choirId: string) {
    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { organizationId: true },
    });
    if (!choir) throw new NotFoundException('Choir not found');
    return this.prisma.organizationSubscription.findFirst({
      where: { organizationId: choir.organizationId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertForChoir(choirId: string, dto: UpdateOrganizationSubscriptionDto) {
    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { organizationId: true },
    });
    if (!choir) throw new NotFoundException('Choir not found');
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const current = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId: choir.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    if (!current) {
      return this.prisma.organizationSubscription.create({
        data: {
          organizationId: choir.organizationId,
          planId: plan.id,
          billingPeriod: dto.billingPeriod || 'MONTHLY',
          status: 'ACTIVE',
        },
        include: { plan: true },
      });
    }
    return this.prisma.organizationSubscription.update({
      where: { id: current.id },
      data: {
        planId: plan.id,
        billingPeriod: dto.billingPeriod,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });
  }

  defaultPlanQuotas(code: SubscriptionPlanCode) {
    if (code === 'FREE') return { members: 30, storageGb: 1, whatsappCredits: 0 };
    if (code === 'PRO') return { members: 150, storageGb: 10, whatsappCredits: 0 };
    return { members: 500, storageGb: 50, whatsappCredits: 0 };
  }
}
