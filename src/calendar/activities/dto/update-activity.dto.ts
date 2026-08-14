import { ActivityType, ActivityVisibility } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateActivityDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  responsibleMembershipId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  targetMembershipIds?: string[];
  @ApiPropertyOptional({ enum: ActivityVisibility })
  @IsOptional()
  @IsEnum(ActivityVisibility)
  visibility?: ActivityVisibility;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  attendanceRequired?: boolean;
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  reminderOffsetsMinutes?: number[];
}
export class UpdateActivitySeriesDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ActivityVisibility })
  @IsOptional()
  @IsEnum(ActivityVisibility)
  visibility?: ActivityVisibility;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  attendanceRequired?: boolean;
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  reminderOffsetsMinutes?: number[];
}
