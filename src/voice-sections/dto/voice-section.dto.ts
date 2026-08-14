import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; import { IsInt, IsOptional, IsString, Min } from 'class-validator';
export class VoiceSectionDto { @ApiProperty() @IsString() name!:string; @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) order?:number; }
