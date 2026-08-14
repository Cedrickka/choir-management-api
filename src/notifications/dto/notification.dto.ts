import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateNotificationTemplateDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsEnum(['ACTIVITY_REMINDER', 'LATE_ARRIVAL', 'ACTIVITY_ENDED', 'MANUAL'])
  trigger!: 'ACTIVITY_REMINDER' | 'LATE_ARRIVAL' | 'ACTIVITY_ENDED' | 'MANUAL';
  @IsEnum(['IN_APP', 'PUSH']) channel!: 'IN_APP' | 'PUSH';
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) body!: string;
  @IsOptional() @IsObject() rules?: Record<string, unknown>;
  @IsOptional() @IsBoolean() enabled?: boolean;
}
export class UpdateNotificationTemplateDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsObject() rules?: Record<string, unknown>;
  @IsOptional() @IsBoolean() enabled?: boolean;
}
export class RegisterDeviceDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsEnum(['android', 'ios', 'web']) platform!: string;
}
export class ListNotificationsQuery {
  @IsOptional() @IsInt() @Min(1) page = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
