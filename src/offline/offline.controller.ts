import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { AuthorizeOfflineDeviceDto, OfflineSyncEventDto } from './dto/offline.dto';
import { OfflineService } from './offline.service';

@ApiTags('Offline')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/offline', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class OfflineController {
  constructor(private readonly offline: OfflineService) {}

  @Get('devices')
  @RequirePermissions('offline.manage')
  listDevices(@Param('choirId') choirId: string) {
    return this.offline.listDevices(choirId);
  }

  @Post('devices')
  @RequirePermissions('offline.manage')
  authorizeDevice(
    @Param('choirId') choirId: string,
    @Body() dto: AuthorizeOfflineDeviceDto,
  ) {
    return this.offline.authorizeDevice(choirId, dto);
  }

  @Post('sync')
  @RequirePermissions('attendance.scan')
  sync(@Param('choirId') choirId: string, @Body() dto: OfflineSyncEventDto) {
    return this.offline.syncEvent(choirId, dto);
  }
}
