import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateDispensationDto,
  CreateJustificationDto,
  ReviewDto,
} from './dto/justification.dto';

@Injectable()
export class JustificationsService {
  constructor(private readonly prisma: PrismaService) {}

  listJustifications(choirId: string) {
    return this.prisma.justification.findMany({
      where: { choirId },
      include: {
        membership: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            profile: { include: { voiceSection: true } },
          },
        },
        activity: { select: { id: true, title: true, startsAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJustification(
    choirId: string,
    actorMembershipId: string,
    canManage: boolean,
    dto: CreateJustificationDto,
  ) {
    const membershipId = dto.membershipId || actorMembershipId;
    if (membershipId !== actorMembershipId && !canManage) {
      throw new ForbiddenException('Cannot create a justification for another member');
    }
    await this.ensureMembership(choirId, membershipId);
    if (dto.activityId) await this.ensureActivity(choirId, dto.activityId);
    if (dto.attendanceId) await this.ensureAttendance(choirId, dto.attendanceId, membershipId);

    return this.prisma.justification.create({
      data: {
        choirId,
        membershipId,
        activityId: dto.activityId,
        attendanceId: dto.attendanceId,
        kind: dto.kind,
        reason: dto.reason,
        comment: dto.comment,
        attachmentUrl: dto.attachmentUrl,
        attachmentStorageKey: dto.attachmentStorageKey,
      },
      include: { activity: true },
    });
  }

  async reviewJustification(
    choirId: string,
    id: string,
    reviewerMembershipId: string,
    dto: ReviewDto,
  ) {
    if (dto.status === ReviewStatus.PENDING) {
      throw new BadRequestException('Review status must be APPROVED or REJECTED');
    }
    const current = await this.prisma.justification.findFirst({
      where: { id, choirId },
    });
    if (!current) throw new NotFoundException('Justification not found');
    return this.prisma.justification.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedByMembershipId: reviewerMembershipId,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
      },
    });
  }

  listDispensations(choirId: string) {
    return this.prisma.dispensation.findMany({
      where: { choirId },
      include: {
        membership: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            profile: { include: { voiceSection: true } },
          },
        },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async createDispensation(
    choirId: string,
    actorMembershipId: string,
    canManage: boolean,
    dto: CreateDispensationDto,
  ) {
    const membershipId = dto.membershipId || actorMembershipId;
    if (membershipId !== actorMembershipId && !canManage) {
      throw new ForbiddenException('Cannot create a dispensation for another member');
    }
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt >= endsAt) throw new BadRequestException('endsAt must be after startsAt');
    await this.ensureMembership(choirId, membershipId);

    return this.prisma.dispensation.create({
      data: {
        choirId,
        membershipId,
        startsAt,
        endsAt,
        reason: dto.reason,
        comment: dto.comment,
        attachmentUrl: dto.attachmentUrl,
        attachmentStorageKey: dto.attachmentStorageKey,
        excludeFromStatistics: dto.excludeFromStatistics ?? true,
      },
    });
  }

  async reviewDispensation(
    choirId: string,
    id: string,
    reviewerMembershipId: string,
    dto: ReviewDto,
  ) {
    if (dto.status === ReviewStatus.PENDING) {
      throw new BadRequestException('Review status must be APPROVED or REJECTED');
    }
    const current = await this.prisma.dispensation.findFirst({
      where: { id, choirId },
    });
    if (!current) throw new NotFoundException('Dispensation not found');
    return this.prisma.dispensation.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedByMembershipId: reviewerMembershipId,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
      },
    });
  }

  private async ensureMembership(choirId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, choirId, archivedAt: null },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Member not found');
  }

  private async ensureActivity(choirId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, choirId },
      select: { id: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
  }

  private async ensureAttendance(
    choirId: string,
    attendanceId: string,
    membershipId: string,
  ) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, choirId, membershipId },
      select: { id: true },
    });
    if (!attendance) throw new NotFoundException('Attendance not found');
  }
}
