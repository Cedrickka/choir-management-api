import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMassContentDto,
  CreateMassSongbookDto,
  GenerateSongbookPublicLinkDto,
} from './dto/liturgy.dto';

@Injectable()
export class LiturgyService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMassContent(
    choirId: string,
    activityId: string,
    actorMembershipId: string,
    dto: CreateMassContentDto,
  ) {
    await this.ensureMassActivity(choirId, activityId);
    const publishedAt = dto.status === 'PUBLISHED' ? new Date() : undefined;
    return this.prisma.massContent.upsert({
      where: { activityId },
      update: {
        title: dto.title,
        liturgicalDate: new Date(dto.liturgicalDate),
        readingsReferences: (dto.readingsReferences ||
          {}) as Prisma.InputJsonValue,
        firstReadingText: dto.firstReadingText,
        psalmText: dto.psalmText,
        secondReadingText: dto.secondReadingText,
        gospelText: dto.gospelText,
        summary: dto.summary,
        orientation: dto.orientation,
        maestroMessage: dto.maestroMessage,
        status: dto.status,
        ...(publishedAt ? { publishedAt } : {}),
      },
      create: {
        choirId,
        activityId,
        title: dto.title,
        liturgicalDate: new Date(dto.liturgicalDate),
        readingsReferences: (dto.readingsReferences ||
          {}) as Prisma.InputJsonValue,
        firstReadingText: dto.firstReadingText,
        psalmText: dto.psalmText,
        secondReadingText: dto.secondReadingText,
        gospelText: dto.gospelText,
        summary: dto.summary,
        orientation: dto.orientation,
        maestroMessage: dto.maestroMessage,
        status: dto.status || 'DRAFT',
        publishedAt,
        createdByMembershipId: actorMembershipId,
      },
    });
  }

  async nextMassContent(choirId: string) {
    return this.prisma.massContent.findFirst({
      where: {
        choirId,
        status: 'PUBLISHED',
        liturgicalDate: {
          gte: new Date(new Date().toISOString().slice(0, 10)),
        },
      },
      orderBy: { liturgicalDate: 'asc' },
    });
  }

  async createSongbook(
    choirId: string,
    activityId: string,
    actorMembershipId: string,
    dto: CreateMassSongbookDto,
  ) {
    await this.ensureMassActivity(choirId, activityId);
    if ((dto.mimeType || 'application/pdf') !== 'application/pdf') {
      throw new BadRequestException('Songbook must be a PDF');
    }
    return this.prisma.massSongbook.create({
      data: {
        choirId,
        activityId,
        title: dto.title,
        storageKey: dto.storageKey,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType || 'application/pdf',
        sizeBytes: dto.sizeBytes,
        checksum: dto.checksum,
        version: dto.version || 1,
        isDownloadable: dto.isDownloadable ?? true,
        createdByMembershipId: actorMembershipId,
      },
    });
  }

  listSongbooks(choirId: string, activityId: string) {
    return this.prisma.massSongbook.findMany({
      where: { choirId, activityId },
      orderBy: { version: 'desc' },
    });
  }

  async generatePublicLink(
    choirId: string,
    songbookId: string,
    dto: GenerateSongbookPublicLinkDto,
  ) {
    const songbook = await this.prisma.massSongbook.findFirst({
      where: { id: songbookId, choirId },
    });
    if (!songbook) throw new NotFoundException('Songbook not found');
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.massSongbook.update({
      where: { id: songbook.id },
      data: {
        publicTokenHash: tokenHash,
        publicExpiresAt: expiresAt,
        publicRevokedAt: null,
      },
    });
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      url: `/api/v1/public/songbooks/${token}`,
    };
  }

  async publicSongbook(token: string) {
    const tokenHash = this.hashToken(token);
    const songbook = await this.prisma.massSongbook.findUnique({
      where: { publicTokenHash: tokenHash },
      include: {
        activity: { select: { title: true, startsAt: true, location: true } },
        choir: { select: { name: true } },
      },
    });
    if (
      !songbook ||
      songbook.publicRevokedAt ||
      !songbook.publicExpiresAt ||
      songbook.publicExpiresAt < new Date()
    ) {
      throw new NotFoundException('Songbook not found');
    }
    return {
      title: songbook.title,
      choir: songbook.choir,
      activity: songbook.activity,
      mimeType: songbook.mimeType,
      fileUrl: songbook.fileUrl,
      storageStatus: songbook.fileUrl ? 'ready' : 'storage_provider_pending',
      isDownloadable: songbook.isDownloadable,
      expiresAt: songbook.publicExpiresAt,
    };
  }

  private async ensureMassActivity(choirId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, choirId },
      select: { id: true, type: true },
    });
    if (!activity) throw new NotFoundException('Mass activity not found');
    if (activity.type !== 'MASS') {
      throw new BadRequestException(
        'This content must be linked to a MASS activity',
      );
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
