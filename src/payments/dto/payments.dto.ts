import {
  CurrencyCode,
  PaymentProviderType,
  PaymentTransactionStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PaymentAllocationDto {
  @IsUUID()
  obligationId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CreatePaymentTransactionDto {
  @IsEnum(PaymentProviderType)
  provider!: PaymentProviderType;

  @IsString()
  idempotencyKey!: string;

  @IsOptional()
  @IsUUID()
  payerMembershipId?: string;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations!: PaymentAllocationDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class PaymentWebhookDto {
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  internalReference?: string;

  @IsOptional()
  @IsString()
  providerReference?: string;

  @IsEnum(PaymentTransactionStatus)
  status!: PaymentTransactionStatus;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
