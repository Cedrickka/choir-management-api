import {
  JustificationKind,
  JustificationReason,
  ReviewStatus,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateJustificationDto {
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsOptional()
  @IsUUID()
  activityId?: string;

  @IsOptional()
  @IsUUID()
  attendanceId?: string;

  @IsEnum(JustificationKind)
  kind!: JustificationKind;

  @IsEnum(JustificationReason)
  reason!: JustificationReason;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentStorageKey?: string;
}

export class ReviewDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class CreateDispensationDto {
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsEnum(JustificationReason)
  reason!: JustificationReason;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentStorageKey?: string;

  @IsOptional()
  @IsBoolean()
  excludeFromStatistics?: boolean;
}
