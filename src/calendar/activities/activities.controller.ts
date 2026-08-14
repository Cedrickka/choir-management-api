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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { ActivitiesService } from './activities.service';
import { CancelActivityDto } from './dto/cancel-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQuery } from './dto/list-activities.query';
import {
  UpdateActivityDto,
  UpdateActivitySeriesDto,
} from './dto/update-activity.dto';
@ApiTags('Calendar')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class ActivitiesController {
  constructor(private activities: ActivitiesService) {}
  @Get('activities') @RequirePermissions('calendar.read') list(
    @Param('choirId') c: string,
    @Query() q: ListActivitiesQuery,
    @Req() req: any,
  ) {
    return this.activities.list(
      c,
      q,
      req.tenant.membershipId,
      this.canManage(req),
    );
  }
  @Post('activities') @RequirePermissions('calendar.create') create(
    @Param('choirId') c: string,
    @Body() d: CreateActivityDto,
  ) {
    return this.activities.create(c, d);
  }
  @Get('activities/:activityId') @RequirePermissions('calendar.read') get(
    @Param('choirId') c: string,
    @Param('activityId') id: string,
    @Req() req: any,
  ) {
    return this.activities.get(
      c,
      id,
      req.tenant.membershipId,
      this.canManage(req),
    );
  }
  @Patch('activities/:activityId')
  @RequirePermissions('calendar.update')
  update(
    @Param('choirId') c: string,
    @Param('activityId') id: string,
    @Body() d: UpdateActivityDto,
  ) {
    return this.activities.update(c, id, d);
  }
  @Post('activities/:activityId/cancel')
  @RequirePermissions('calendar.update')
  cancel(
    @Param('choirId') c: string,
    @Param('activityId') id: string,
    @Body() d: CancelActivityDto,
  ) {
    return this.activities.cancel(c, id, d.reason);
  }
  @Patch('activity-series/:seriesId')
  @RequirePermissions('calendar.update')
  series(
    @Param('choirId') c: string,
    @Param('seriesId') id: string,
    @Body() d: UpdateActivitySeriesDto,
  ) {
    return this.activities.updateSeries(c, id, d);
  }
  private canManage(req: any) {
    return (
      req.tenant.permissionCodes.includes('calendar.create') ||
      req.tenant.permissionCodes.includes('calendar.update')
    );
  }
}
