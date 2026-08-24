import {
  AnnouncementAudienceType,
  AnnouncementPriority,
  ContentStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsEnum(AnnouncementAudienceType)
  audienceType?: AnnouncementAudienceType;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  readRequired?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  voiceSectionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

export class ListAnnouncementsQueryDto {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
