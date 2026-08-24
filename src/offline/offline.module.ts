import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { OfflineController } from './offline.controller';
import { OfflineService } from './offline.service';

@Module({
  controllers: [OfflineController],
  providers: [OfflineService, TenantAccessGuard, PermissionsGuard],
})
export class OfflineModule {}
