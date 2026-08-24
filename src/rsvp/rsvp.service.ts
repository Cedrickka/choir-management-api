import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityVisibility, RsvpAnswer } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RsvpResponseDto, UpsertRsvpRequestDto } from './dto/rsvp.dto';

@Injectable()
export class RsvpService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRequest(
    choirId: string,
    activityId: string,
    actorMembershipId: string,
    dto: UpsertRsvpRequestDto,
  ) {
    await this.ensureActivity(choirId, activityId);
    return this.prisma.rsvpRequest.upsert({
      where: { activityId },
      update: {
        message: dto.message,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
        minByVoiceSection: dto.minByVoiceSection || {},
      },
      create: {
        choirId,
        activityId,
        createdByMembershipId: actorMembershipId,
        message: dto.message,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : undefined,
        minByVoiceSection: dto.minByVoiceSection || {},
      },
      include: { activity: true },
    });
  }

  async getRequest(
    choirId: string,
    activityId: string,
    actorMembershipId: string,
    canManage = false,
  ) {
    const request = await this.prisma.rsvpRequest.findFirst({
      where: { choirId, activityId },
      include: {
        activity: true,
        responses: canManage
          ? {
              include: {
                membership: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                    },
                    profile: { include: { voiceSection: true } },
                  },
                },
              },
            }
          : {
              where: { membershipId: actorMembershipId },
              include: {
                membership: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                    },
                    profile: { include: { voiceSection: true } },
                  },
                },
              },
            },
      },
    });
    if (!request) throw new NotFoundException('RSVP request not found');
    return {
      ...request,
      responses: request.responses.map((response) => ({
        ...response,
        membership: this.safeMembership(response.membership),
      })),
    };
  }

  async respond(
    choirId: string,
    activityId: string,
    membershipId: string,
    dto: RsvpResponseDto,
  ) {
    const request = await this.prisma.rsvpRequest.findFirst({
      where: { choirId, activityId },
    });
    if (!request) throw new NotFoundException('RSVP request not found');
    if (request.deadlineAt && request.deadlineAt < new Date()) {
      throw new BadRequestException('RSVP deadline has passed');
    }
    await this.ensureExpectedMember(choirId, activityId, membershipId);
    return this.prisma.rsvpResponse.upsert({
      where: { requestId_membershipId: { requestId: request.id, membershipId } },
      update: { answer: dto.answer, comment: dto.comment, respondedAt: new Date() },
      create: {
        requestId: request.id,
        choirId,
        activityId,
        membershipId,
        answer: dto.answer,
        comment: dto.comment,
      },
    });
  }

  async summary(choirId: string, activityId: string) {
    const request = await this.prisma.rsvpRequest.findFirst({
      where: { choirId, activityId },
      include: { activity: { include: { targets: true } }, responses: true },
    });
    if (!request) throw new NotFoundException('RSVP request not found');

    const expected = await this.expectedMembers(choirId, request.activity);
    const byMember = new Map(request.responses.map((row) => [row.membershipId, row.answer]));
    const groups = new Map<
      string,
      {
        voiceSection: { id: string; name: string } | null;
        expected: number;
        yes: number;
        no: number;
        maybe: number;
        noResponse: number;
      }
    >();

    for (const membership of expected) {
      const section = membership.profile?.voiceSection || null;
      const key = section?.id || 'unassigned';
      const current =
        groups.get(key) ||
        {
          voiceSection: section ? { id: section.id, name: section.name } : null,
          expected: 0,
          yes: 0,
          no: 0,
          maybe: 0,
          noResponse: 0,
        };
      current.expected += 1;
      const answer = byMember.get(membership.id);
      if (answer === RsvpAnswer.YES) current.yes += 1;
      else if (answer === RsvpAnswer.NO) current.no += 1;
      else if (answer === RsvpAnswer.MAYBE) current.maybe += 1;
      else current.noResponse += 1;
      groups.set(key, current);
    }

    const minByVoiceSection = (request.minByVoiceSection || {}) as Record<string, number>;
    const byVoiceSection = [...groups.values()].map((row) => ({
      ...row,
      minimumExpected: row.voiceSection ? minByVoiceSection[row.voiceSection.id] || 0 : 0,
      understaffed: row.voiceSection
        ? row.yes < (minByVoiceSection[row.voiceSection.id] || 0)
        : false,
    }));
    return {
      requestId: request.id,
      activityId,
      deadlineAt: request.deadlineAt,
      totals: byVoiceSection.reduce(
        (acc, row) => ({
          expected: acc.expected + row.expected,
          yes: acc.yes + row.yes,
          no: acc.no + row.no,
          maybe: acc.maybe + row.maybe,
          noResponse: acc.noResponse + row.noResponse,
        }),
        { expected: 0, yes: 0, no: 0, maybe: 0, noResponse: 0 },
      ),
      byVoiceSection,
      note: 'Le RSVP estime la disponibilité et ne remplace jamais le pointage réel.',
    };
  }

  private async ensureActivity(choirId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, choirId },
      select: { id: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
  }

  private async ensureExpectedMember(choirId: string, activityId: string, membershipId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, choirId },
      include: { targets: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const expected = await this.expectedMembers(choirId, activity);
    if (!expected.some((membership) => membership.id === membershipId)) {
      throw new NotFoundException('RSVP target not found');
    }
  }

  private async expectedMembers(
    choirId: string,
    activity: {
      visibility: ActivityVisibility;
      targets: { membershipId: string }[];
    },
  ) {
    const baseWhere = {
      choirId,
      status: 'ACTIVE' as const,
      archivedAt: null,
    };
    const where =
      activity.visibility === 'TARGETED'
        ? {
            ...baseWhere,
            id: { in: activity.targets.map((target) => target.membershipId) },
          }
        : activity.visibility === 'LEADERS_ONLY'
          ? {
              ...baseWhere,
              roles: { some: { role: { code: { not: 'MEMBER' } } } },
            }
          : baseWhere;
    return this.prisma.membership.findMany({
      where,
      include: {
        profile: { include: { voiceSection: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
  }

  private safeMembership(membership: any) {
    return {
      id: membership.id,
      userId: membership.userId,
      user: membership.user
        ? {
            id: membership.user.id,
            firstName: membership.user.firstName,
            lastName: membership.user.lastName,
            email: membership.user.email,
            phone: membership.user.phone,
          }
        : null,
      profile: membership.profile,
    };
  }
}
