import { BillingPeriod, SubscriptionPlanCode } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateOrganizationSubscriptionDto {
  @IsEnum(SubscriptionPlanCode)
  planCode!: SubscriptionPlanCode;

  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;
}
