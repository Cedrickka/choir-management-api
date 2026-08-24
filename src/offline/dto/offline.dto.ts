import { OfflineEventType } from '@prisma/client';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class AuthorizeOfflineDeviceDto {
  @IsString()
  deviceIdentifier!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;
}

export class OfflineSyncEventDto {
  @IsString()
  deviceIdentifier!: string;

  @IsString()
  clientEventId!: string;

  @IsEnum(OfflineEventType)
  type!: OfflineEventType;

  @IsDateString()
  localTimestamp!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
