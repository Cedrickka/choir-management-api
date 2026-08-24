import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuthorizeOfflineDeviceDto, OfflineSyncEventDto } from './dto/offline.dto';

@Injectable()
export class OfflineService {
  constructor(private readonly prisma: PrismaService) {}

  listDevices(choirId: string) {
    return this.prisma.offlineDevice.findMany({
      where: { choirId },
      include: {
        membership: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async authorizeDevice(choirId: string, dto: AuthorizeOfflineDeviceDto) {
    if (dto.membershipId) {
      const member = await this.prisma.membership.findFirst({
        where: { id: dto.membershipId, choirId, archivedAt: null },
      });
      if (!member) throw new NotFoundException('Member not found');
    }
    return this.prisma.offlineDevice.upsert({
      where: {
        choirId_deviceIdentifier: {
          choirId,
          deviceIdentifier: dto.deviceIdentifier,
        },
      },
      update: {
        label: dto.label,
        membershipId: dto.membershipId,
        publicKey: dto.publicKey,
        active: true,
        revokedAt: null,
      },
      create: {
        choirId,
        deviceIdentifier: dto.deviceIdentifier,
        label: dto.label,
        membershipId: dto.membershipId,
        publicKey: dto.publicKey,
      },
    });
  }

  async syncEvent(choirId: string, dto: OfflineSyncEventDto) {
    const device = await this.prisma.offlineDevice.findFirst({
      where: { choirId, deviceIdentifier: dto.deviceIdentifier, active: true, revokedAt: null },
    });
    if (!device) throw new NotFoundException('Offline device not authorized');

    const existing = await this.prisma.offlineSyncEvent.findUnique({
      where: {
        choirId_offlineDeviceId_clientEventId: {
          choirId,
          offlineDeviceId: device.id,
          clientEventId: dto.clientEventId,
        },
      },
    });
    if (existing) return { status: 'DUPLICATE', event: existing };

    const result =
      dto.type === 'ATTENDANCE_SCAN'
        ? {
            note: 'Offline attendance scan recorded for server-side conflict resolution.',
          }
        : { note: 'Offline event recorded.' };

    const event = await this.prisma.offlineSyncEvent.create({
      data: {
        choirId,
        offlineDeviceId: device.id,
        clientEventId: dto.clientEventId,
        type: dto.type,
        localTimestamp: new Date(dto.localTimestamp),
        payload: dto.payload as Prisma.InputJsonValue,
        status: 'RECEIVED',
        result,
      },
    });
    return { status: event.status, event };
  }
}
