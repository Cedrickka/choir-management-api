import { RsvpAnswer } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertRsvpRequestDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  deadlineAt?: string;

  @IsOptional()
  @IsObject()
  minByVoiceSection?: Record<string, number>;
}

export class RsvpResponseDto {
  @IsEnum(RsvpAnswer)
  answer!: RsvpAnswer;

  @IsOptional()
  @IsString()
  comment?: string;
}
