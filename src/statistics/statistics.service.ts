import { Injectable } from '@nestjs/common';
import { ActivityStatus, ActivityType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  AttendanceFact,
  ExpectedAttendanceSlot,
  MemberStatistics,
  StatisticsCalculator,
  StatisticsIdentity,
} from './statistics-calculator';
import {
  MyStatisticsQueryDto,
  StatisticsQueryDto,
} from './dto/statistics-query.dto';

type ActivityRow = {
  id: string;
  type: ActivityType;
  startsAt: Date;
  endsAt: Date;
  visibility: 'ALL_MEMBERS' | 'LEADERS_ONLY' | 'TARGETED';
  targets: { membershipId: string }[];
};

type MembershipRow = {
  id: string;
  userId: string;
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  profile: {
    voiceSection: { id: string; name: string } | null;
  } | null;
  roles: { role: { code: string } }[];
};

type DispensationRow = {
  membershipId: string;
  startsAt: Date;
  endsAt: Date;
};

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async myStatistics(userId: string, query: MyStatisticsQueryDto) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        archivedAt: null,
        ...(query.choirId ? { choirId: query.choirId } : {}),
        ...(query.membershipId ? { id: query.membershipId } : {}),
        choir: { status: 'ACTIVE', organization: { status: 'ACTIVE' } },
      },
      include: {
        choir: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            organizationId: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const data = await Promise.all(
      memberships.map(async (membership) => {
        const dataset = await this.buildDataset(
          membership.choirId,
          { ...query, membershipId: membership.id },
          [membership.id],
        );
        return {
          choir: membership.choir,
          membershipId: membership.id,
          statistics:
            dataset.members[0] ||
            StatisticsCalculator.summarizeMember(
              {
                membershipId: membership.id,
                userId,
                firstName: '',
                lastName: '',
                email: null,
                phone: null,
                voiceSection: null,
              },
              [],
              [],
            ),
          denominator: dataset.denominator,
        };
      }),
    );

    return { generatedAt: new Date().toISOString(), data };
  }

  async choirSummary(choirId: string, query: StatisticsQueryDto) {
    const dataset = await this.buildDataset(choirId, query);
    return {
      generatedAt: new Date().toISOString(),
      choirId,
      filters: this.filters(query, dataset.computedUntil),
      denominator: dataset.denominator,
      overview: dataset.overview,
      byVoiceSection: this.byVoiceSection(dataset.members),
    };
  }

  async memberStatistics(choirId: string, query: StatisticsQueryDto) {
    const dataset = await this.buildDataset(choirId, query);
    const page = query.page || 1;
    const limit = query.limit || 50;
    const start = (page - 1) * limit;
    const data = dataset.members.slice(start, start + limit);
    return {
      generatedAt: new Date().toISOString(),
      choirId,
      filters: this.filters(query, dataset.computedUntil),
      denominator: dataset.denominator,
      data,
      meta: {
        page,
        limit,
        total: dataset.members.length,
        totalPages: Math.ceil(dataset.members.length / limit),
      },
    };
  }

  async exportMembersCsv(choirId: string, query: StatisticsQueryDto) {
    const dataset = await this.buildDataset(choirId, query);
    const headers = [
      'membershipId',
      'firstName',
      'lastName',
      'email',
      'voiceSection',
      'expectedActivities',
      'present',
      'absent',
      'attendanceRate',
      'onTime',
      'late',
      'severelyLate',
      'punctualityRate',
      'minutesLateTotal',
      'averageMinutesLate',
      'durationMinutesTotal',
      'completeParticipations',
      'partialParticipations',
      'insufficientParticipations',
      'pendingParticipations',
    ];
    const lines = [
      headers.join(','),
      ...dataset.members.map((member) =>
        [
          member.membershipId,
          member.firstName,
          member.lastName,
          member.email || '',
          member.voiceSection?.name || '',
          member.expectedActivities,
          member.present,
          member.absent,
          member.attendanceRate,
          member.onTime,
          member.late,
          member.severelyLate,
          member.punctualityRate,
          member.minutesLateTotal,
          member.averageMinutesLate,
          member.durationMinutesTotal,
          member.completeParticipations,
          member.partialParticipations,
          member.insufficientParticipations,
          member.pendingParticipations,
        ]
          .map((value) => this.csv(value))
          .join(','),
      ),
    ];
    return `\ufeff${lines.join('\n')}\n`;
  }

  private async buildDataset(
    choirId: string,
    query: StatisticsQueryDto,
    restrictedMembershipIds?: string[],
  ) {
    const computedUntil = this.computedUntil(query);
    const activities = (await this.prisma.activity.findMany({
      where: {
        choirId,
        attendanceRequired: true,
        status: {
          notIn: [ActivityStatus.CANCELLED, ActivityStatus.POSTPONED],
        },
        ...(query.activityType ? { type: query.activityType } : {}),
        ...(query.startDate
          ? { startsAt: { gte: new Date(query.startDate) } }
          : {}),
        endsAt: { lte: computedUntil },
      },
      select: {
        id: true,
        type: true,
        startsAt: true,
        endsAt: true,
        visibility: true,
        targets: { select: { membershipId: true } },
      },
      orderBy: { startsAt: 'asc' },
    })) as ActivityRow[];

    const memberships = (await this.prisma.membership.findMany({
      where: {
        choirId,
        status: 'ACTIVE',
        archivedAt: null,
        ...(query.membershipId ? { id: query.membershipId } : {}),
        ...(restrictedMembershipIds
          ? { id: { in: restrictedMembershipIds } }
          : {}),
        ...(query.voiceSectionId
          ? { profile: { is: { voiceSectionId: query.voiceSectionId } } }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        profile: { include: { voiceSection: true } },
        roles: { include: { role: { select: { code: true } } } },
      },
      orderBy: { joinedAt: 'asc' },
    })) as MembershipRow[];

    const activityIds = activities.map((activity) => activity.id);
    const membershipIds = memberships.map((membership) => membership.id);
    const attendances = activityIds.length
      ? ((await this.prisma.attendance.findMany({
          where: {
            choirId,
            activityId: { in: activityIds },
            membershipId: { in: membershipIds },
          },
          select: {
            activityId: true,
            membershipId: true,
            arrivedAt: true,
            leftAt: true,
            status: true,
            participationStatus: true,
            minutesLate: true,
            durationMinutes: true,
          },
        })) as AttendanceFact[])
      : [];

    const periodStart = activities[0]?.startsAt;
    const dispensations =
      activityIds.length && membershipIds.length
        ? ((await this.prisma.dispensation.findMany({
            where: {
              choirId,
              membershipId: { in: membershipIds },
              status: 'APPROVED',
              excludeFromStatistics: true,
              startsAt: { lte: computedUntil },
              ...(periodStart ? { endsAt: { gte: periodStart } } : {}),
            },
            select: { membershipId: true, startsAt: true, endsAt: true },
          })) as DispensationRow[])
        : [];

    const expectedSlots = this.expectedSlots(
      activities,
      memberships,
      dispensations,
    );
    const members = memberships
      .map((membership) =>
        StatisticsCalculator.summarizeMember(
          this.identity(membership),
          expectedSlots,
          attendances,
        ),
      )
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
        ),
      );

    return {
      computedUntil,
      members,
      overview: StatisticsCalculator.aggregate(members),
      denominator: {
        expectedActivities:
          'Activités passées, non annulées/reportées, avec présence requise, pour lesquelles le membre est attendu, hors dispenses approuvées configurées comme exclues.',
        attendanceRate: 'présences enregistrées / activités attendues',
        punctualityRate: 'arrivées à l’heure / présences enregistrées',
        participation:
          'calculée uniquement depuis les pointages arrivée/sortie disponibles',
      },
    };
  }

  private computedUntil(query: StatisticsQueryDto): Date {
    const now = new Date();
    if (!query.endDate) return now;
    const end = new Date(query.endDate);
    return end.getTime() < now.getTime() ? end : now;
  }

  private expectedSlots(
    activities: ActivityRow[],
    memberships: MembershipRow[],
    dispensations: DispensationRow[] = [],
  ): ExpectedAttendanceSlot[] {
    const slots: ExpectedAttendanceSlot[] = [];
    for (const activity of activities) {
      const targeted = new Set(
        activity.targets.map((target) => target.membershipId),
      );
      for (const membership of memberships) {
        if (membership.joinedAt.getTime() > activity.endsAt.getTime()) continue;
        if (activity.visibility === 'TARGETED' && !targeted.has(membership.id))
          continue;
        if (
          activity.visibility === 'LEADERS_ONLY' &&
          !membership.roles.some((role) => role.role.code !== 'MEMBER')
        )
          continue;
        if (
          dispensations.some(
            (dispensation) =>
              dispensation.membershipId === membership.id &&
              dispensation.startsAt.getTime() <= activity.endsAt.getTime() &&
              dispensation.endsAt.getTime() >= activity.startsAt.getTime(),
          )
        )
          continue;
        slots.push({ activityId: activity.id, membershipId: membership.id });
      }
    }
    return slots;
  }

  private identity(membership: MembershipRow): StatisticsIdentity {
    return {
      membershipId: membership.id,
      userId: membership.userId,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      email: membership.user.email,
      phone: membership.user.phone,
      voiceSection: membership.profile?.voiceSection || null,
    };
  }

  private byVoiceSection(members: MemberStatistics[]) {
    const groups = new Map<string, MemberStatistics[]>();
    for (const member of members) {
      const key = member.voiceSection?.id || 'unassigned';
      groups.set(key, [...(groups.get(key) || []), member]);
    }
    return [...groups.entries()].map(([key, rows]) => ({
      voiceSection:
        key === 'unassigned'
          ? null
          : rows[0].voiceSection
            ? { id: rows[0].voiceSection.id, name: rows[0].voiceSection.name }
            : null,
      membersCount: rows.length,
      statistics: StatisticsCalculator.aggregate(rows),
    }));
  }

  private filters(query: StatisticsQueryDto, computedUntil: Date) {
    return {
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      computedUntil: computedUntil.toISOString(),
      activityType: query.activityType || null,
      membershipId: query.membershipId || null,
      voiceSectionId: query.voiceSectionId || null,
    };
  }

  private csv(value: string | number): string {
    const text = String(value);
    if (!/[",\n\r]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }
}
