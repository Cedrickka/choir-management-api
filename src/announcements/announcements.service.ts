import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnnouncementAudienceType,
  AnnouncementTargetType,
  ContentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateAnnouncementDto,
  ListAnnouncementsQueryDto,
} from './dto/announcement.dto';

type AudienceContext = {
  membershipId: string;
  voiceSectionId: string | null;
  roleIds: string[];
};

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    choirId: string,
    actorMembershipId: string,
    dto: CreateAnnouncementDto,
  ) {
    const audienceType =
      dto.audienceType || AnnouncementAudienceType.ALL_MEMBERS;
    await this.validateTargets(choirId, audienceType, dto);
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : new Date();
    const status = dto.status || ContentStatus.PUBLISHED;

    return this.prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          choirId,
          title: dto.title,
          body: dto.body,
          priority: dto.priority,
          audienceType,
          attachments: (dto.attachments || []) as Prisma.InputJsonValue,
          status,
          publishAt,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          readRequired: dto.readRequired ?? false,
          createdByMembershipId: actorMembershipId,
        },
      });

      const targets = this.targetRows(announcement.id, audienceType, dto);
      if (targets.length)
        await tx.announcementTarget.createMany({ data: targets });

      if (status === ContentStatus.PUBLISHED) {
        const targetMembershipIds = await this.resolveTargetMembershipIds(
          choirId,
          audienceType,
          dto,
          tx,
        );
        if (targetMembershipIds.length) {
          await tx.notificationJob.createMany({
            data: targetMembershipIds.map((membershipId) => ({
              choirId,
              membershipId,
              channel: 'IN_APP',
              trigger: 'MANUAL',
              titleSnapshot: announcement.title,
              bodySnapshot: announcement.body.slice(0, 500),
              scheduledAt: publishAt,
              idempotencyKey: `announcement:${announcement.id}:${membershipId}`,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.announcement.findUnique({
        where: { id: announcement.id },
        include: { targets: true },
      });
    });
  }

  async listForMember(
    choirId: string,
    membershipId: string,
    query: ListAnnouncementsQueryDto,
    canManage = false,
  ) {
    const context = await this.audienceContext(choirId, membershipId);
    const now = new Date();
    const rows = await this.prisma.announcement.findMany({
      where: {
        choirId,
        ...(canManage && query.status
          ? { status: query.status }
          : { status: ContentStatus.PUBLISHED, publishAt: { lte: now } }),
        ...(!canManage
          ? { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
          : {}),
      },
      include: {
        targets: true,
        reads: { where: { membershipId } },
      },
      orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
    });
    const visible = canManage
      ? rows
      : rows.filter((announcement) =>
          this.matchesAudience(
            announcement.audienceType,
            announcement.targets,
            context,
          ),
        );
    const start = (query.page - 1) * query.limit;
    return {
      data: visible.slice(start, start + query.limit).map((announcement) => ({
        ...announcement,
        readAt: announcement.reads[0]?.readAt || null,
        acknowledgedAt: announcement.reads[0]?.acknowledgedAt || null,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total: visible.length,
        totalPages: Math.ceil(visible.length / query.limit),
      },
    };
  }

  async markRead(
    choirId: string,
    announcementId: string,
    membershipId: string,
    acknowledge = true,
  ) {
    await this.ensureVisible(choirId, announcementId, membershipId, false);
    return this.prisma.announcementRead.upsert({
      where: { announcementId_membershipId: { announcementId, membershipId } },
      update: {
        ...(acknowledge ? { acknowledgedAt: new Date() } : {}),
      },
      create: {
        announcementId,
        membershipId,
        ...(acknowledge ? { acknowledgedAt: new Date() } : {}),
      },
    });
  }

  async receipts(choirId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, choirId },
      include: { targets: true, reads: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    const targetMembershipIds = await this.resolveTargetMembershipIds(
      choirId,
      announcement.audienceType,
      {
        membershipIds: announcement.targets
          .filter((target) => target.membershipId)
          .map((target) => target.membershipId!),
        voiceSectionIds: announcement.targets
          .filter((target) => target.voiceSectionId)
          .map((target) => target.voiceSectionId!),
        roleIds: announcement.targets
          .filter((target) => target.roleId)
          .map((target) => target.roleId!),
      },
    );
    const readMembershipIds = new Set(
      announcement.reads.map((read) => read.membershipId),
    );
    return {
      announcementId,
      targetCount: targetMembershipIds.length,
      readCount: targetMembershipIds.filter((id) => readMembershipIds.has(id))
        .length,
      readRate: targetMembershipIds.length
        ? Math.round(
            (targetMembershipIds.filter((id) => readMembershipIds.has(id))
              .length /
              targetMembershipIds.length) *
              10000,
          ) / 10000
        : 0,
      reads: announcement.reads,
    };
  }

  private async ensureVisible(
    choirId: string,
    announcementId: string,
    membershipId: string,
    canManage: boolean,
  ) {
    const context = await this.audienceContext(choirId, membershipId);
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, choirId },
      include: { targets: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (canManage) return announcement;
    const now = new Date();
    if (
      announcement.status !== ContentStatus.PUBLISHED ||
      announcement.publishAt > now ||
      (announcement.expiresAt && announcement.expiresAt <= now) ||
      !this.matchesAudience(
        announcement.audienceType,
        announcement.targets,
        context,
      )
    ) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  private async validateTargets(
    choirId: string,
    audienceType: AnnouncementAudienceType,
    dto: CreateAnnouncementDto,
  ) {
    if (audienceType === AnnouncementAudienceType.ALL_MEMBERS) return;
    if (audienceType === AnnouncementAudienceType.MEMBERS) {
      if (!dto.membershipIds?.length) {
        throw new BadRequestException('membershipIds are required');
      }
      const count = await this.prisma.membership.count({
        where: { id: { in: dto.membershipIds }, choirId, archivedAt: null },
      });
      if (count !== new Set(dto.membershipIds).size) {
        throw new NotFoundException('One or more members were not found');
      }
    }
    if (audienceType === AnnouncementAudienceType.VOICE_SECTIONS) {
      if (!dto.voiceSectionIds?.length) {
        throw new BadRequestException('voiceSectionIds are required');
      }
      const count = await this.prisma.voiceSection.count({
        where: { id: { in: dto.voiceSectionIds }, choirId },
      });
      if (count !== new Set(dto.voiceSectionIds).size) {
        throw new NotFoundException(
          'One or more voice sections were not found',
        );
      }
    }
    if (audienceType === AnnouncementAudienceType.ROLES) {
      if (!dto.roleIds?.length)
        throw new BadRequestException('roleIds are required');
      const choir = await this.prisma.choir.findUnique({
        where: { id: choirId },
        select: { organizationId: true },
      });
      const count = await this.prisma.role.count({
        where: {
          id: { in: dto.roleIds },
          organizationId: choir?.organizationId,
        },
      });
      if (count !== new Set(dto.roleIds).size) {
        throw new NotFoundException('One or more roles were not found');
      }
    }
  }

  private targetRows(
    announcementId: string,
    audienceType: AnnouncementAudienceType,
    dto: CreateAnnouncementDto,
  ) {
    if (audienceType === AnnouncementAudienceType.MEMBERS) {
      return (dto.membershipIds || []).map((membershipId) => ({
        announcementId,
        targetType: AnnouncementTargetType.MEMBERSHIP,
        membershipId,
      }));
    }
    if (audienceType === AnnouncementAudienceType.VOICE_SECTIONS) {
      return (dto.voiceSectionIds || []).map((voiceSectionId) => ({
        announcementId,
        targetType: AnnouncementTargetType.VOICE_SECTION,
        voiceSectionId,
      }));
    }
    if (audienceType === AnnouncementAudienceType.ROLES) {
      return (dto.roleIds || []).map((roleId) => ({
        announcementId,
        targetType: AnnouncementTargetType.ROLE,
        roleId,
      }));
    }
    return [];
  }

  private async resolveTargetMembershipIds(
    choirId: string,
    audienceType: AnnouncementAudienceType,
    dto: {
      membershipIds?: string[];
      voiceSectionIds?: string[];
      roleIds?: string[];
    },
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    if (audienceType === AnnouncementAudienceType.ALL_MEMBERS) {
      return (
        await tx.membership.findMany({
          where: { choirId, status: 'ACTIVE', archivedAt: null },
          select: { id: true },
        })
      ).map((membership) => membership.id);
    }
    if (audienceType === AnnouncementAudienceType.MEMBERS) {
      return dto.membershipIds || [];
    }
    if (audienceType === AnnouncementAudienceType.VOICE_SECTIONS) {
      return (
        await tx.membership.findMany({
          where: {
            choirId,
            status: 'ACTIVE',
            archivedAt: null,
            profile: {
              is: { voiceSectionId: { in: dto.voiceSectionIds || [] } },
            },
          },
          select: { id: true },
        })
      ).map((membership) => membership.id);
    }
    return (
      await tx.membership.findMany({
        where: {
          choirId,
          status: 'ACTIVE',
          archivedAt: null,
          roles: { some: { roleId: { in: dto.roleIds || [] } } },
        },
        select: { id: true },
      })
    ).map((membership) => membership.id);
  }

  private async audienceContext(
    choirId: string,
    membershipId: string,
  ): Promise<AudienceContext> {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, choirId },
      include: { profile: true, roles: true },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return {
      membershipId,
      voiceSectionId: membership.profile?.voiceSectionId || null,
      roleIds: membership.roles.map((role) => role.roleId),
    };
  }

  private matchesAudience(
    audienceType: AnnouncementAudienceType,
    targets: {
      membershipId: string | null;
      voiceSectionId: string | null;
      roleId: string | null;
    }[],
    context: AudienceContext,
  ) {
    if (audienceType === AnnouncementAudienceType.ALL_MEMBERS) return true;
    if (audienceType === AnnouncementAudienceType.MEMBERS) {
      return targets.some(
        (target) => target.membershipId === context.membershipId,
      );
    }
    if (audienceType === AnnouncementAudienceType.VOICE_SECTIONS) {
      return targets.some(
        (target) =>
          target.voiceSectionId &&
          target.voiceSectionId === context.voiceSectionId,
      );
    }
    return targets.some(
      (target) => target.roleId && context.roleIds.includes(target.roleId),
    );
  }
}
