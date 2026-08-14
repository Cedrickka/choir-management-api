import {
  ActivityType,
  ActivityVisibility,
  RecurrenceType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
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
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class RecurrenceDto {
  @ApiProperty({ enum: RecurrenceType })
  @IsEnum(RecurrenceType)
  type!: RecurrenceType;
  @ApiProperty() @IsDateString() until!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  interval?: number;
  @ApiPropertyOptional({
    description: 'ISO weekdays: Monday=1, Sunday=7',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  daysOfWeek?: number[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsDateString({}, { each: true })
  customDates?: string[];
}
export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type!: ActivityType;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsDateString() startsAt!: string;
  @ApiProperty() @IsDateString() endsAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() pastoralYearId?: string;
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
  @ApiPropertyOptional({ type: RecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}
