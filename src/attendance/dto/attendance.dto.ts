import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GenerateQrDto {
  @IsEnum(['ARRIVAL', 'DEPARTURE']) scanType!: 'ARRIVAL' | 'DEPARTURE';
}
export class ScanAttendanceDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsOptional() @IsString() @MaxLength(120) deviceId?: string;
}
export class CorrectAttendanceDto {
  @IsString() @IsNotEmpty() @MaxLength(500) reason!: string;
  @IsOptional() @IsString() arrivedAt?: string;
  @IsOptional() @IsString() leftAt?: string;
}
