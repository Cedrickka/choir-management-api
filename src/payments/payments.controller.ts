import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentProviderType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreatePaymentTransactionDto,
  PaymentWebhookDto,
} from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/payments', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class ChoirPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('transactions')
  @RequirePermissions('payments.read')
  list(@Param('choirId') choirId: string) {
    return this.payments.listTransactions(choirId);
  }

  @Post('transactions')
  @RequirePermissions('payments.manage')
  create(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreatePaymentTransactionDto,
  ) {
    return this.payments.createTransaction(choirId, req.tenant.membershipId, dto);
  }
}

@ApiTags('Payments')
@Controller({ path: 'payments/webhooks', version: '1' })
export class PaymentWebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':provider')
  handleWebhook(
    @Param('provider') provider: PaymentProviderType,
    @Headers('x-payment-signature') signature: string | undefined,
    @Body() dto: PaymentWebhookDto,
  ) {
    return this.payments.handleWebhook(provider, dto, signature);
  }
}
