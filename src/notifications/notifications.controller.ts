import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateNotificationTemplateDto,
  ListNotificationsQuery,
  RegisterDeviceDto,
  UpdateNotificationTemplateDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get('notification-templates')
  @RequirePermissions('notifications.manage')
  templates(@Param('choirId') c: string) {
    return this.service.listTemplates(c);
  }
  @Post('notification-templates')
  @RequirePermissions('notifications.manage')
  create(
    @Param('choirId') c: string,
    @Body() d: CreateNotificationTemplateDto,
  ) {
    return this.service.createTemplate(c, d);
  }
  @Patch('notification-templates/:id')
  @RequirePermissions('notifications.manage')
  update(
    @Param('choirId') c: string,
    @Param('id') id: string,
    @Body() d: UpdateNotificationTemplateDto,
  ) {
    return this.service.updateTemplate(c, id, d);
  }
  @Get('notifications') @RequirePermissions('notifications.read') list(
    @Req() req: any,
    @Query() q: ListNotificationsQuery,
  ) {
    return this.service.listForMember(req.tenant.membershipId, q.page, q.limit);
  }
  @Post('notifications/:id/read')
  @RequirePermissions('notifications.read')
  read(@Req() req: any, @Param('id') id: string) {
    return this.service.markRead(req.tenant.membershipId, id);
  }
  @Post('devices') @RequirePermissions('notifications.read') device(
    @Req() req: any,
    @Body() d: RegisterDeviceDto,
  ) {
    return this.service.registerDevice(req.user.id, d.token, d.platform);
  }
}
