import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { RsvpResponseDto, UpsertRsvpRequestDto } from './dto/rsvp.dto';
import { RsvpService } from './rsvp.service';

@ApiTags('RSVP')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/activities/:activityId/rsvp', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class RsvpController {
  constructor(private readonly rsvp: RsvpService) {}

  @Post('request')
  @RequirePermissions('rsvp.manage')
  upsertRequest(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: UpsertRsvpRequestDto,
  ) {
    return this.rsvp.upsertRequest(choirId, activityId, req.tenant.membershipId, dto);
  }

  @Get()
  @RequirePermissions('rsvp.respond')
  get(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
  ) {
    return this.rsvp.getRequest(
      choirId,
      activityId,
      req.tenant.membershipId,
      req.tenant.permissionCodes.includes('rsvp.manage'),
    );
  }

  @Post()
  @RequirePermissions('rsvp.respond')
  respond(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: RsvpResponseDto,
  ) {
    return this.rsvp.respond(choirId, activityId, req.tenant.membershipId, dto);
  }

  @Get('summary')
  @RequirePermissions('rsvp.manage')
  summary(@Param('choirId') choirId: string, @Param('activityId') activityId: string) {
    return this.rsvp.summary(choirId, activityId);
  }
}
