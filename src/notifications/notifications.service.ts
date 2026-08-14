import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './dto/notification.dto';
import { NotificationQueueService } from './notification-queue.service';
import { PushProvider } from './push.provider';
import { TemplateRenderer } from './template-renderer';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private push: PushProvider,
    private queue: NotificationQueueService,
  ) {}
  listTemplates(choirId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { choirId },
      orderBy: { name: 'asc' },
    });
  }
  createTemplate(choirId: string, dto: CreateNotificationTemplateDto) {
    TemplateRenderer.render(dto.title, {});
    TemplateRenderer.render(dto.body, {});
    return this.prisma.notificationTemplate.create({
      data: {
        choirId,
        name: dto.name,
        trigger: dto.trigger,
        channel: dto.channel,
        title: dto.title,
        body: dto.body,
        enabled: dto.enabled,
        rules: (dto.rules || {}) as Prisma.InputJsonValue,
      },
    });
  }
  async updateTemplate(
    choirId: string,
    id: string,
    dto: UpdateNotificationTemplateDto,
  ) {
    const current = await this.prisma.notificationTemplate.findFirst({
      where: { id, choirId },
    });
    if (!current)
      throw new NotFoundException('Notification template not found');
    if (dto.title) TemplateRenderer.render(dto.title, {});
    if (dto.body) TemplateRenderer.render(dto.body, {});
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        enabled: dto.enabled,
        ...(dto.rules ? { rules: dto.rules as Prisma.InputJsonValue } : {}),
        version: { increment: 1 },
      },
    });
  }
  async scheduleActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { choir: true, targets: true },
    });
    if (!activity) return;
    await this.prisma.notificationJob.updateMany({
      where: { activityId, status: 'QUEUED' },
      data: { status: 'CANCELLED' },
    });
    if (activity.status === 'CANCELLED' || activity.status === 'COMPLETED')
      return;
    const templates = await this.prisma.notificationTemplate.findMany({
      where: {
        choirId: activity.choirId,
        enabled: true,
        trigger: { in: ['ACTIVITY_REMINDER', 'LATE_ARRIVAL'] },
      },
    });
    const targetIds =
      activity.visibility === 'TARGETED'
        ? activity.targets.map((x) => x.membershipId)
        : (
            await this.prisma.membership.findMany({
              where: {
                choirId: activity.choirId,
                status: 'ACTIVE',
                archivedAt: null,
              },
              select: { id: true },
            })
          ).map((x) => x.id);
    for (const template of templates) {
      const rules = template.rules as Record<string, unknown>;
      const offsets =
        template.trigger === 'LATE_ARRIVAL'
          ? [Number(rules.minutesAfter || 10) * -1]
          : activity.reminderOffsetsMinutes.length
            ? activity.reminderOffsetsMinutes
            : [Number(rules.offsetMinutes || 1440)];
      for (const membershipId of targetIds)
        for (const offset of offsets) {
          const scheduledAt = new Date(
            activity.startsAt.getTime() - offset * 60000,
          );
          const variables = {
            Activite: activity.title,
            Date: activity.startsAt.toLocaleDateString('fr-CD', {
              timeZone: activity.timezone,
            }),
            Heure: activity.startsAt.toLocaleTimeString('fr-CD', {
              timeZone: activity.timezone,
              hour: '2-digit',
              minute: '2-digit',
            }),
            Lieu: activity.location || '',
          };
          const data = {
            choirId: activity.choirId,
            templateId: template.id,
            membershipId,
            activityId,
            channel: template.channel,
            trigger: template.trigger,
            titleSnapshot: TemplateRenderer.render(template.title, variables),
            bodySnapshot: TemplateRenderer.render(template.body, variables),
            scheduledAt,
            idempotencyKey: `${template.id}:${template.version}:${activityId}:${membershipId}:${scheduledAt.toISOString()}`,
          } as const;
          const job = await this.prisma.notificationJob.upsert({
            where: { idempotencyKey: data.idempotencyKey },
            update: {},
            create: data,
          });
          await this.queue.wake(job.id, scheduledAt);
        }
    }
  }
  @Cron('*/30 * * * * *') async dispatchDue() {
    const jobs = await this.prisma.notificationJob.findMany({
      where: { status: 'QUEUED', scheduledAt: { lte: new Date() } },
      take: 50,
      orderBy: { scheduledAt: 'asc' },
    });
    for (const job of jobs) await this.dispatch(job.id);
  }
  async dispatch(id: string) {
    const claimed = await this.prisma.notificationJob.updateMany({
      where: { id, status: 'QUEUED' },
      data: { status: 'PROCESSING' },
    });
    if (!claimed.count) return;
    const job = await this.prisma.notificationJob.findUniqueOrThrow({
      where: { id },
      include: { membership: true },
    });
    try {
      if (
        job.trigger === 'LATE_ARRIVAL' &&
        job.activityId &&
        (await this.prisma.attendance.findUnique({
          where: {
            activityId_membershipId: {
              activityId: job.activityId,
              membershipId: job.membershipId,
            },
          },
        }))
      ) {
        await this.prisma.notificationJob.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
        return;
      }
      if (job.channel === 'IN_APP')
        await this.prisma.inAppNotification.upsert({
          where: { jobId: id },
          update: {},
          create: {
            jobId: id,
            membershipId: job.membershipId,
            title: job.titleSnapshot,
            body: job.bodySnapshot,
          },
        });
      else {
        const tokens = await this.prisma.deviceToken.findMany({
          where: { userId: job.membership.userId, active: true },
          select: { token: true },
        });
        await this.push.send({
          tokens: tokens.map((x) => x.token),
          title: job.titleSnapshot,
          body: job.bodySnapshot,
          data: {
            choirId: job.choirId,
            ...(job.activityId ? { activityId: job.activityId } : {}),
          },
        });
      }
      await this.prisma.notificationJob.update({
        where: { id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      await this.prisma.notificationJob.update({
        where: { id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason:
            error instanceof Error
              ? error.message.slice(0, 500)
              : 'Unknown error',
        },
      });
    }
  }
  listForMember(membershipId: string, page = 1, limit = 20) {
    return this.prisma.inAppNotification.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  async markRead(membershipId: string, id: string) {
    const result = await this.prisma.inAppNotification.updateMany({
      where: { id, membershipId },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Notification not found');
    return { read: true };
  }
  registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, active: true },
      create: { userId, token, platform },
    });
  }
}
