import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { PastoralYearsController } from './pastoral-years/pastoral-years.controller';
import { PastoralYearsService } from './pastoral-years/pastoral-years.service';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [NotificationsModule],
  controllers: [ActivitiesController, PastoralYearsController],
  providers: [
    ActivitiesService,
    PastoralYearsService,
    TenantAccessGuard,
    PermissionsGuard,
  ],
})
export class CalendarModule {}
