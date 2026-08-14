import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { AttendanceService } from './attendance.service';
import {
  CorrectAttendanceDto,
  GenerateQrDto,
  ScanAttendanceDto,
} from './dto/attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private service: AttendanceService) {}
  @Post('activities/:activityId/attendance/qr')
  @RequirePermissions('calendar.read')
  qr(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: GenerateQrDto,
  ) {
    return this.service.generateQr(
      choirId,
      activityId,
      req.tenant.membershipId,
      dto.scanType,
    );
  }
  @Post('activities/:activityId/attendance/scan')
  @RequirePermissions('attendance.scan')
  scan(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: ScanAttendanceDto,
  ) {
    return this.service.scan(
      choirId,
      req.tenant.membershipId,
      dto.token,
      dto.deviceId,
    );
  }
  @Get('activities/:activityId/attendance')
  @RequirePermissions('attendance.read')
  history(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.service.history(choirId, activityId);
  }
  @Post('attendance/:attendanceId/corrections')
  @RequirePermissions('attendance.correct')
  correct(
    @Param('choirId') choirId: string,
    @Param('attendanceId') attendanceId: string,
    @Req() req: any,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Body() dto: CorrectAttendanceDto,
  ) {
    return this.service.correct(
      choirId,
      attendanceId,
      req.user.id,
      dto,
      correlationId,
    );
  }
}
