import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LiturgicalSeason,
  MediaVisibility,
  SongDifficulty,
  SongMasteryStatus,
  SongStatus,
  SongTrackType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListSongsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(LiturgicalSeason)
  liturgicalSeason?: LiturgicalSeason;

  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'true pour afficher les chants de mon pupitre à travailler.',
  })
  @IsOptional()
  @IsBooleanString()
  forMyVoiceSection?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;
}

export class CreateSongDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  composer?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(LiturgicalSeason)
  liturgicalSeason?: LiturgicalSeason;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(SongDifficulty)
  difficulty?: SongDifficulty;

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  lyrics?: string;

  @IsOptional()
  @IsString()
  copyrightNotes?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  scorePdfUrl?: string;
}

export class CreateSongTrackDto {
  @IsEnum(SongTrackType)
  type!: SongTrackType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsUUID()
  voiceSectionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  keySignature?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: MediaVisibility;

  @IsString()
  storageKey!: string;

  @IsString()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  checksum!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}

export class CreateSongRehearsalDto {
  @IsOptional()
  @IsUUID()
  activityId?: string;

  @IsDateString()
  rehearsedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSongMasteryDto {
  @IsEnum(SongMasteryStatus)
  status!: SongMasteryStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
