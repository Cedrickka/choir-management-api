import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AttendanceController],
  providers: [AttendanceService, TenantAccessGuard, PermissionsGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
