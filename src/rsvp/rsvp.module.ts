import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { RsvpController } from './rsvp.controller';
import { RsvpService } from './rsvp.service';

@Module({
  controllers: [RsvpController],
  providers: [RsvpService, TenantAccessGuard, PermissionsGuard],
})
export class RsvpModule {}
