import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { RecurrenceCalculator } from '../recurrence/recurrence-calculator';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQuery } from './dto/list-activities.query';
import {
  UpdateActivityDto,
  UpdateActivitySeriesDto,
} from './dto/update-activity.dto';
@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notifications?: NotificationsService,
  ) {}
  private async schedule(activityId: string) {
    await this.notifications?.scheduleActivity(activityId);
  }
  private validTimezone(timezone: string) {
    if (!DateTime.now().setZone(timezone).isValid)
      throw new BadRequestException('Invalid timezone');
  }
  private async validateReferences(
    choirId: string,
    pastoralYearId?: string,
    responsibleMembershipId?: string,
    startsAt?: Date,
    endsAt?: Date,
  ) {
    if (startsAt && endsAt && startsAt >= endsAt)
      throw new BadRequestException('endsAt must be after startsAt');
    if (pastoralYearId) {
      const year = await this.prisma.pastoralYear.findFirst({
        where: { id: pastoralYearId, choirId },
      });
      if (!year) throw new NotFoundException('Pastoral year not found');
      if (
        startsAt &&
        (startsAt < year.startDate ||
          startsAt >
            new Date(
              `${year.endDate.toISOString().slice(0, 10)}T23:59:59.999Z`,
            ))
      )
        throw new BadRequestException('Activity is outside the pastoral year');
    }
    if (
      responsibleMembershipId &&
      !(await this.prisma.membership.findFirst({
        where: {
          id: responsibleMembershipId,
          choirId,
          status: 'ACTIVE',
          archivedAt: null,
        },
      }))
    )
      throw new NotFoundException('Responsible membership not found');
  }
  private async validateTargets(choirId: string, ids: string[] = []) {
    if (!ids.length) return;
    const count = await this.prisma.membership.count({
      where: { id: { in: ids }, choirId, status: 'ACTIVE', archivedAt: null },
    });
    if (count !== ids.length)
      throw new NotFoundException(
        'One or more target memberships were not found',
      );
  }
  async create(choirId: string, dto: CreateActivityDto) {
    const choir = await this.prisma.choir.findUnique({
      where: { id: choirId },
      select: { timezone: true },
    });
    if (!choir) throw new NotFoundException('Choir not found');
    const timezone = dto.timezone || choir.timezone;
    this.validTimezone(timezone);
    const startsAt = new Date(dto.startsAt),
      endsAt = new Date(dto.endsAt);
    await this.validateReferences(
      choirId,
      dto.pastoralYearId,
      dto.responsibleMembershipId,
      startsAt,
      endsAt,
    );
    if (dto.visibility === 'TARGETED' && !dto.targetMembershipIds?.length)
      throw new BadRequestException(
        'TARGETED activities require target memberships',
      );
    await this.validateTargets(choirId, dto.targetMembershipIds);
    const duration = endsAt.getTime() - startsAt.getTime();
    const common = {
      choirId,
      pastoralYearId: dto.pastoralYearId,
      type: dto.type,
      title: dto.title,
      timezone,
      location: dto.location,
      description: dto.description,
      responsibleMembershipId: dto.responsibleMembershipId,
      visibility: dto.visibility,
      attendanceRequired: dto.attendanceRequired,
      reminderOffsetsMinutes: dto.reminderOffsetsMinutes || [],
    };
    if (!dto.recurrence) {
      const activity = await this.prisma.activity.create({
        data: {
          ...common,
          startsAt,
          endsAt,
          targets: {
            create: (dto.targetMembershipIds || []).map((membershipId) => ({
              membershipId,
            })),
          },
        },
      });
      await this.schedule(activity.id);
      return activity;
    }
    const occurrences = RecurrenceCalculator.generate(dto.startsAt, timezone, {
      type: dto.recurrence.type,
      until: dto.recurrence.until,
      interval: dto.recurrence.interval,
      daysOfWeek: dto.recurrence.daysOfWeek,
      customDates: dto.recurrence.customDates,
    });
    if (!occurrences.length)
      throw new BadRequestException('Recurrence produces no occurrence');
    if (dto.pastoralYearId) {
      const last = occurrences[occurrences.length - 1];
      await this.validateReferences(
        choirId,
        dto.pastoralYearId,
        undefined,
        last,
        new Date(last.getTime() + duration),
      );
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const series = await tx.activitySeries.create({
        data: {
          choirId,
          recurrenceType: dto.recurrence!.type,
          interval: dto.recurrence!.interval || 1,
          daysOfWeek: dto.recurrence!.daysOfWeek || [],
          customDates: (dto.recurrence!.customDates || []).map(
            (x) => new Date(x),
          ),
          until: new Date(dto.recurrence!.until),
          timezone,
        },
      });
      await tx.activity.createMany({
        data: occurrences.map((occurrence) => ({
          ...common,
          seriesId: series.id,
          startsAt: occurrence,
          endsAt: new Date(occurrence.getTime() + duration),
        })),
      });
      if (dto.targetMembershipIds?.length) {
        const created = await tx.activity.findMany({
          where: { seriesId: series.id },
          select: { id: true },
        });
        await tx.activityTarget.createMany({
          data: created.flatMap((activity) =>
            dto.targetMembershipIds!.map((membershipId) => ({
              activityId: activity.id,
              membershipId,
            })),
          ),
        });
      }
      return { seriesId: series.id, occurrenceCount: occurrences.length };
    });
    if (this.notifications) {
      const created = await this.prisma.activity.findMany({
        where: { seriesId: result.seriesId },
        select: { id: true },
      });
      for (const activity of created) await this.schedule(activity.id);
    }
    return result;
  }
  async list(
    choirId: string,
    q: ListActivitiesQuery,
    membershipId?: string,
    canManage = false,
  ) {
    const where = {
      choirId,
      ...(!canManage
        ? {
            OR: [
              { visibility: 'ALL_MEMBERS' as const },
              {
                visibility: 'TARGETED' as const,
                targets: { some: { membershipId } },
              },
            ],
          }
        : {}),
      ...(q.from || q.to
        ? {
            startsAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }
  async get(
    choirId: string,
    id: string,
    membershipId?: string,
    canManage = true,
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id,
        choirId,
        ...(!canManage
          ? {
              OR: [
                { visibility: 'ALL_MEMBERS' as const },
                {
                  visibility: 'TARGETED' as const,
                  targets: { some: { membershipId } },
                },
              ],
            }
          : {}),
      },
      include: {
        pastoralYear: true,
        series: true,
        responsibleMembership: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        targets: {
          include: {
            membership: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }
  async update(choirId: string, id: string, dto: UpdateActivityDto) {
    const current = await this.get(choirId, id);
    if (current.startsAt <= new Date())
      throw new BadRequestException('Past activities are immutable');
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt,
      endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
    await this.validateReferences(
      choirId,
      current.pastoralYearId || undefined,
      dto.responsibleMembershipId,
      startsAt,
      endsAt,
    );
    await this.validateTargets(choirId, dto.targetMembershipIds);
    const { targetMembershipIds, ...data } = dto;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (targetMembershipIds) {
        await tx.activityTarget.deleteMany({ where: { activityId: id } });
        if (targetMembershipIds.length)
          await tx.activityTarget.createMany({
            data: targetMembershipIds.map((membershipId) => ({
              activityId: id,
              membershipId,
            })),
          });
      }
      return tx.activity.update({
        where: { id },
        data: {
          ...data,
          startsAt,
          endsAt,
          isSeriesOverride:
            Boolean(current.seriesId) || current.isSeriesOverride,
        },
      });
    });
    await this.schedule(id);
    return updated;
  }
  async cancel(choirId: string, id: string, reason: string) {
    const current = await this.get(choirId, id);
    if (current.startsAt <= new Date())
      throw new BadRequestException('Past activities are immutable');
    const cancelled = await this.prisma.activity.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        isSeriesOverride: Boolean(current.seriesId) || current.isSeriesOverride,
      },
    });
    await this.schedule(id);
    return cancelled;
  }
  async updateSeries(
    choirId: string,
    seriesId: string,
    dto: UpdateActivitySeriesDto,
  ) {
    if (
      !(await this.prisma.activitySeries.findFirst({
        where: { id: seriesId, choirId },
      }))
    )
      throw new NotFoundException('Activity series not found');
    const result = await this.prisma.activity.updateMany({
      where: {
        choirId,
        seriesId,
        startsAt: { gt: new Date() },
        isSeriesOverride: false,
      },
      data: dto,
    });
    if (this.notifications) {
      const future = await this.prisma.activity.findMany({
        where: {
          choirId,
          seriesId,
          startsAt: { gt: new Date() },
          isSeriesOverride: false,
        },
        select: { id: true },
      });
      for (const activity of future) await this.schedule(activity.id);
    }
    return { updatedOccurrences: result.count };
  }
}
