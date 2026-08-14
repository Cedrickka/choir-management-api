import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebasePushProvider, PushProvider } from './push.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    FirebasePushProvider,
    { provide: PushProvider, useExisting: FirebasePushProvider },
    TenantAccessGuard,
    PermissionsGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
