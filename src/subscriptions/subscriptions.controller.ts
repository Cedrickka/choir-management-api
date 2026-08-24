import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { UpdateOrganizationSubscriptionDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionPlansController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  listPlans() {
    return this.subscriptions.listPlans();
  }
}

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/subscription', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class ChoirSubscriptionController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  @RequirePermissions('subscriptions.read')
  get(@Param('choirId') choirId: string) {
    return this.subscriptions.getForChoir(choirId);
  }

  @Put()
  @RequirePermissions('subscriptions.manage')
  update(
    @Param('choirId') choirId: string,
    @Body() dto: UpdateOrganizationSubscriptionDto,
  ) {
    return this.subscriptions.upsertForChoir(choirId, dto);
  }
}
