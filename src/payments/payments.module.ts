import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  ChoirPaymentsController,
  PaymentWebhooksController,
} from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [ChoirPaymentsController, PaymentWebhooksController],
  providers: [PaymentsService, TenantAccessGuard, PermissionsGuard],
})
export class PaymentsModule {}
