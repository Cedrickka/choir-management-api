import { ContentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMassContentDto {
  @IsString()
  title!: string;

  @IsDateString()
  liturgicalDate!: string;

  @IsOptional()
  @IsObject()
  readingsReferences?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  firstReadingText?: string;

  @IsOptional()
  @IsString()
  psalmText?: string;

  @IsOptional()
  @IsString()
  secondReadingText?: string;

  @IsOptional()
  @IsString()
  gospelText?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  orientation?: string;

  @IsOptional()
  @IsString()
  maestroMessage?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class CreateMassSongbookDto {
  @IsString()
  title!: string;

  @IsString()
  storageKey!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;
}

export class GenerateSongbookPublicLinkDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
