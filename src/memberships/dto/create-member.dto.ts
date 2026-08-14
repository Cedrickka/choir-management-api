import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUUID, MinLength } from 'class-validator';
export class CreateMemberDto {
  @ApiProperty() @IsString() firstName!: string;
  @ApiProperty() @IsString() lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiProperty({ minLength: 12, description: 'Temporary development/onboarding password' }) @IsString() @MinLength(12) temporaryPassword!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() voiceSectionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() functionTitle?: string;
}
