import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { JustificationsController } from './justifications.controller';
import { JustificationsService } from './justifications.service';

@Module({
  controllers: [JustificationsController],
  providers: [JustificationsService, TenantAccessGuard, PermissionsGuard],
})
export class JustificationsModule {}
