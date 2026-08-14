import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MembershipStatus } from '@prisma/client';
export class UpdateMemberDto {
  @ApiPropertyOptional() @IsOptional() @IsString() postName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() voiceSectionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() functionTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() whatsappConsent?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappConsentSource?: string;
}
