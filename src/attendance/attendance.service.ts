import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AttendanceCalculator } from './attendance-calculator';
import { CorrectAttendanceDto } from './dto/attendance.dto';

type QrPayload = {
  jti: string;
  choirId: string;
  activityId: string;
  membershipId: string;
  scanType: 'ARRIVAL' | 'DEPARTURE';
};

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  private secret() {
    return (
      this.config.get<string>('ATTENDANCE_QR_SECRET') ||
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET')
    );
  }

  async generateQr(
    choirId: string,
    activityId: string,
    membershipId: string,
    scanType: 'ARRIVAL' | 'DEPARTURE',
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, choirId, attendanceRequired: true },
      include: { targets: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const member = await this.prisma.membership.findFirst({
      where: { id: membershipId, choirId, status: 'ACTIVE', archivedAt: null },
    });
    if (
      !member ||
      (activity.visibility === 'TARGETED' &&
        !activity.targets.some((x) => x.membershipId === membershipId))
    )
      throw new ForbiddenException('Member is not expected for this activity');
    const now = new Date();
    if (
      now < new Date(activity.startsAt.getTime() - 30 * 60000) ||
      now > activity.endsAt
    )
      throw new BadRequestException('Attendance window is closed');
    const existing = await this.prisma.attendance.findUnique({
      where: { activityId_membershipId: { activityId, membershipId } },
    });
    if (scanType === 'DEPARTURE' && !existing?.arrivedAt)
      throw new BadRequestException('Arrival must be recorded first');
    if (scanType === 'ARRIVAL' && existing?.arrivedAt)
      throw new ConflictException('Arrival already recorded');
    if (scanType === 'DEPARTURE' && existing?.leftAt)
      throw new ConflictException('Departure already recorded');
    const jti = randomUUID();
    const expiresAt = new Date(now.getTime() + 120000);
    const payload: QrPayload = {
      jti,
      choirId,
      activityId,
      membershipId,
      scanType,
    };
    const token = await this.jwt.signAsync(payload, {
      secret: this.secret(),
      expiresIn: '2m',
      issuer: 'choir-management-api',
      audience: 'attendance-scan',
    });
    await this.prisma.attendanceQrToken.create({
      data: {
        choirId,
        activityId,
        membershipId,
        scanType,
        expiresAt,
        tokenHash: this.hash(jti),
      },
    });
    return { token, expiresAt, scanType };
  }

  async scan(
    choirId: string,
    scannerMembershipId: string,
    rawToken: string,
    deviceId?: string,
  ) {
    let payload: QrPayload;
    try {
      payload = await this.jwt.verifyAsync<QrPayload>(rawToken, {
        secret: this.secret(),
        issuer: 'choir-management-api',
        audience: 'attendance-scan',
      });
    } catch {
      throw new BadRequestException('Invalid or expired QR token');
    }
    if (payload.choirId !== choirId)
      throw new ForbiddenException('Resource unavailable');
    return this.prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const consumed = await tx.attendanceQrToken.updateMany({
          where: {
            tokenHash: this.hash(payload.jti),
            choirId,
            activityId: payload.activityId,
            membershipId: payload.membershipId,
            scanType: payload.scanType,
            consumedAt: null,
            expiresAt: { gt: now },
          },
          data: { consumedAt: now },
        });
        if (consumed.count !== 1)
          throw new ConflictException('QR token already used or expired');
        const qr = await tx.attendanceQrToken.findUniqueOrThrow({
          where: { tokenHash: this.hash(payload.jti) },
        });
        const activity = await tx.activity.findFirst({
          where: { id: payload.activityId, choirId },
          include: { choir: true },
        });
        const member = await tx.membership.findFirst({
          where: {
            id: payload.membershipId,
            choirId,
            status: 'ACTIVE',
            archivedAt: null,
          },
          include: {
            user: { select: { firstName: true, lastName: true } },
            profile: { include: { voiceSection: true } },
          },
        });
        if (!activity || !member)
          throw new NotFoundException('Attendance context not found');
        const settings = (activity.choir.settings || {}) as Record<
          string,
          unknown
        >;
        const severe = Number(settings.severeLateMinutes || 30),
          minimum = Number(settings.minimumParticipationRatio || 0.75);
        let attendance;
        if (payload.scanType === 'ARRIVAL') {
          const result = AttendanceCalculator.arrival(
            activity.startsAt,
            now,
            severe,
          );
          try {
            attendance = await tx.attendance.create({
              data: {
                choirId,
                activityId: activity.id,
                membershipId: member.id,
                arrivedAt: now,
                status: result.status,
                minutesLate: result.minutesLate,
                voiceSectionId: member.profile?.voiceSectionId,
              },
            });
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            )
              throw new ConflictException('Arrival already recorded');
            throw error;
          }
        } else {
          const current = await tx.attendance.findUnique({
            where: {
              activityId_membershipId: {
                activityId: activity.id,
                membershipId: member.id,
              },
            },
          });
          if (!current?.arrivedAt || current.leftAt)
            throw new ConflictException('Departure cannot be recorded');
          const result = AttendanceCalculator.participation(
            current.arrivedAt,
            now,
            activity.startsAt,
            activity.endsAt,
            minimum,
          );
          attendance = await tx.attendance.update({
            where: { id: current.id },
            data: { leftAt: now, ...result },
          });
        }
        await tx.attendanceScan.create({
          data: {
            attendanceId: attendance.id,
            qrTokenId: qr.id,
            scanType: payload.scanType,
            scannedById: scannerMembershipId,
            deviceId,
            scannedAt: now,
          },
        });
        if (payload.scanType === 'ARRIVAL')
          await tx.notificationJob.updateMany({
            where: {
              activityId: activity.id,
              membershipId: member.id,
              trigger: 'LATE_ARRIVAL',
              status: 'QUEUED',
            },
            data: { status: 'CANCELLED' },
          });
        return {
          attendance,
          member: {
            membershipId: member.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            photoUrl: member.profile?.photoUrl,
            voiceSection: member.profile?.voiceSection?.name,
          },
          scannedAt: now,
          result: attendance.status,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async history(choirId: string, activityId: string) {
    return this.prisma.attendance.findMany({
      where: { choirId, activityId },
      include: {
        membership: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            profile: { include: { voiceSection: true } },
          },
        },
        scans: true,
      },
      orderBy: { arrivedAt: 'asc' },
    });
  }

  async correct(
    choirId: string,
    attendanceId: string,
    actorUserId: string,
    dto: CorrectAttendanceDto,
    correlationId?: string,
  ) {
    const before = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, choirId },
      include: { activity: true },
    });
    if (!before) throw new NotFoundException('Attendance not found');
    const arrivedAt = dto.arrivedAt
      ? new Date(dto.arrivedAt)
      : before.arrivedAt;
    const leftAt = dto.leftAt ? new Date(dto.leftAt) : before.leftAt;
    if (!arrivedAt) throw new BadRequestException('arrivedAt is required');
    const arrival = AttendanceCalculator.arrival(
      before.activity.startsAt,
      arrivedAt,
    );
    const participation = leftAt
      ? AttendanceCalculator.participation(
          arrivedAt,
          leftAt,
          before.activity.startsAt,
          before.activity.endsAt,
        )
      : { durationMinutes: null, participationStatus: 'PENDING' as const };
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.attendance.update({
        where: { id: attendanceId },
        data: { arrivedAt, leftAt, ...arrival, ...participation },
      });
      await tx.auditLog.create({
        data: {
          choirId,
          actorUserId,
          action: 'attendance.correct',
          entityType: 'Attendance',
          entityId: attendanceId,
          reason: dto.reason,
          before: before as unknown as Prisma.InputJsonValue,
          after: after as unknown as Prisma.InputJsonValue,
          correlationId,
        },
      });
      return after;
    });
  }
}
