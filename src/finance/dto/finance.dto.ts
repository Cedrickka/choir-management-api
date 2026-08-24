import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CurrencyCode,
  FinanceContributionFrequency,
  FinanceFundType,
  FinancePaymentMethod,
  FinanceTargetType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateFinanceFundDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(FinanceFundType)
  type?: FinanceFundType;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}

export class CreateContributionDto {
  @IsUUID()
  fundId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  @IsOptional()
  @IsEnum(FinanceContributionFrequency)
  frequency?: FinanceContributionFrequency;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsEnum(FinanceTargetType)
  targetType?: FinanceTargetType;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  voiceSectionIds?: string[];
}

export class CreateContributionPaymentDto {
  @IsUUID()
  obligationId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsEnum(FinancePaymentMethod)
  method?: FinancePaymentMethod;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFinanceIncomeDto {
  @IsUUID()
  fundId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  @IsOptional()
  @IsEnum(FinancePaymentMethod)
  method?: FinancePaymentMethod;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  proofStorageKey?: string;
}

export class CreateFinanceExpenseDto {
  @IsUUID()
  fundId!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  beneficiary?: string;

  @IsString()
  reason!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  @IsOptional()
  @IsEnum(FinancePaymentMethod)
  method?: FinancePaymentMethod;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  proofStorageKey?: string;
}

export class FinanceReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  fundId?: string;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;
}

export class MyFinanceQueryDto {
  @IsOptional()
  @IsUUID()
  choirId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;
}
