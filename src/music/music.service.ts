import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SongMasteryStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSongDto,
  CreateSongRehearsalDto,
  CreateSongTrackDto,
  ListSongsQueryDto,
  UpdateSongMasteryDto,
} from './dto/music.dto';

const allowedAudioMimeTypes = new Set([
  'audio/aac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
]);

@Injectable()
export class MusicService {
  constructor(private readonly prisma: PrismaService) {}

  async listSongs(
    choirId: string,
    query: ListSongsQueryDto,
    membershipId: string,
  ) {
    const memberVoiceSectionId =
      query.forMyVoiceSection === 'true'
        ? await this.currentVoiceSectionId(choirId, membershipId)
        : null;
    const andFilters: Prisma.SongWhereInput[] = [];
    if (query.search) {
      andFilters.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { composer: { contains: query.search, mode: 'insensitive' } },
          { author: { contains: query.search, mode: 'insensitive' } },
          { lyrics: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (memberVoiceSectionId) {
      andFilters.push({
        OR: [
          {
            masteries: {
              none: { voiceSectionId: memberVoiceSectionId },
            },
          },
          {
            masteries: {
              some: {
                voiceSectionId: memberVoiceSectionId,
                status: {
                  in: [
                    SongMasteryStatus.TO_DISCOVER,
                    SongMasteryStatus.IN_PROGRESS,
                    SongMasteryStatus.TO_REVIEW,
                  ],
                },
              },
            },
          },
        ],
      });
    }
    const where: Prisma.SongWhereInput = {
      choirId,
      ...(query.status
        ? { status: query.status }
        : { status: { not: 'ARCHIVED' } }),
      ...(query.category ? { category: query.category } : {}),
      ...(query.liturgicalSeason
        ? { liturgicalSeason: query.liturgicalSeason }
        : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.song.findMany({
        where,
        include: {
          _count: { select: { tracks: true, rehearsals: true } },
          masteries: memberVoiceSectionId
            ? { where: { voiceSectionId: memberVoiceSectionId } }
            : false,
        },
        orderBy: { title: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.song.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  createSong(choirId: string, actorMembershipId: string, dto: CreateSongDto) {
    return this.prisma.song.create({
      data: {
        choirId,
        title: dto.title,
        composer: dto.composer,
        author: dto.author,
        language: dto.language || 'fr',
        category: dto.category,
        liturgicalSeason: dto.liturgicalSeason,
        tags: dto.tags || [],
        difficulty: dto.difficulty,
        status: dto.status || 'ACTIVE',
        lyrics: dto.lyrics,
        copyrightNotes: dto.copyrightNotes,
        coverImageUrl: dto.coverImageUrl,
        scorePdfUrl: dto.scorePdfUrl,
        createdByMembershipId: actorMembershipId,
      },
    });
  }

  async getSong(
    choirId: string,
    songId: string,
    membershipId: string,
    canManage = false,
  ) {
    const memberVoiceSectionId = await this.currentVoiceSectionId(
      choirId,
      membershipId,
    );
    const song = await this.prisma.song.findFirst({
      where: { id: songId, choirId },
      include: {
        tracks: {
          where: this.visibleTrackWhere(memberVoiceSectionId, canManage),
          orderBy: [{ type: 'asc' }, { version: 'desc' }],
        },
        rehearsals: {
          include: {
            activity: { select: { id: true, title: true, startsAt: true } },
          },
          orderBy: { rehearsedAt: 'desc' },
        },
        masteries: { include: { voiceSection: true } },
      },
    });
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }

  async createTrack(choirId: string, songId: string, dto: CreateSongTrackDto) {
    await this.ensureSong(choirId, songId);
    if (!allowedAudioMimeTypes.has(dto.mimeType)) {
      throw new BadRequestException('Unsupported audio mime type');
    }
    if (dto.visibility === 'VOICE_SECTION' && !dto.voiceSectionId) {
      throw new BadRequestException(
        'VOICE_SECTION tracks require voiceSectionId',
      );
    }
    if (dto.voiceSectionId) {
      await this.ensureVoiceSection(choirId, dto.voiceSectionId);
    }
    return this.prisma.songTrack.create({
      data: {
        choirId,
        songId,
        type: dto.type,
        title: dto.title,
        voiceSectionId: dto.voiceSectionId,
        version: dto.version || 1,
        keySignature: dto.keySignature,
        comment: dto.comment,
        visibility: dto.visibility || 'ALL_MEMBERS',
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        checksum: dto.checksum,
        durationSeconds: dto.durationSeconds,
      },
    });
  }

  async listTracks(
    choirId: string,
    songId: string,
    membershipId: string,
    canManage = false,
  ) {
    await this.ensureSong(choirId, songId);
    const memberVoiceSectionId = await this.currentVoiceSectionId(
      choirId,
      membershipId,
    );
    return this.prisma.songTrack.findMany({
      where: {
        songId,
        choirId,
        archivedAt: null,
        ...this.visibleTrackWhere(memberVoiceSectionId, canManage),
      },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }

  async addRehearsal(
    choirId: string,
    songId: string,
    actorMembershipId: string,
    dto: CreateSongRehearsalDto,
  ) {
    await this.ensureSong(choirId, songId);
    if (dto.activityId) {
      const activity = await this.prisma.activity.findFirst({
        where: { id: dto.activityId, choirId },
      });
      if (!activity) throw new NotFoundException('Activity not found');
    }
    return this.prisma.songRehearsal.create({
      data: {
        choirId,
        songId,
        activityId: dto.activityId,
        rehearsedAt: new Date(dto.rehearsedAt),
        notes: dto.notes,
        createdByMembershipId: actorMembershipId,
      },
    });
  }

  async updateMastery(
    choirId: string,
    songId: string,
    voiceSectionId: string,
    actorMembershipId: string,
    dto: UpdateSongMasteryDto,
  ) {
    await this.ensureSong(choirId, songId);
    await this.ensureVoiceSection(choirId, voiceSectionId);
    return this.prisma.songVoiceSectionMastery.upsert({
      where: { songId_voiceSectionId: { songId, voiceSectionId } },
      update: {
        status: dto.status,
        notes: dto.notes,
        updatedByMembershipId: actorMembershipId,
      },
      create: {
        choirId,
        songId,
        voiceSectionId,
        status: dto.status,
        notes: dto.notes,
        updatedByMembershipId: actorMembershipId,
      },
    });
  }

  private async ensureSong(choirId: string, songId: string) {
    const song = await this.prisma.song.findFirst({
      where: { id: songId, choirId },
      select: { id: true },
    });
    if (!song) throw new NotFoundException('Song not found');
  }

  private async ensureVoiceSection(choirId: string, voiceSectionId: string) {
    const voiceSection = await this.prisma.voiceSection.findFirst({
      where: { id: voiceSectionId, choirId },
      select: { id: true },
    });
    if (!voiceSection) throw new NotFoundException('Voice section not found');
  }

  private async currentVoiceSectionId(choirId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, choirId },
      include: { profile: true },
    });
    return membership?.profile?.voiceSectionId || null;
  }

  private visibleTrackWhere(
    voiceSectionId: string | null,
    canManage: boolean,
  ): Prisma.SongTrackWhereInput {
    if (canManage) return {};
    return {
      OR: [
        { visibility: 'ALL_MEMBERS' },
        ...(voiceSectionId
          ? [{ visibility: 'VOICE_SECTION' as const, voiceSectionId }]
          : []),
      ],
    };
  }
}
