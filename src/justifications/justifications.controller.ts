import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateDispensationDto,
  CreateJustificationDto,
  ReviewDto,
} from './dto/justification.dto';
import { JustificationsService } from './justifications.service';

@ApiTags('Justifications')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class JustificationsController {
  constructor(private readonly justifications: JustificationsService) {}

  @Get('justifications')
  @RequirePermissions('justifications.read')
  listJustifications(@Param('choirId') choirId: string) {
    return this.justifications.listJustifications(choirId);
  }

  @Post('justifications')
  @RequirePermissions('justifications.create')
  createJustification(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateJustificationDto,
  ) {
    return this.justifications.createJustification(
      choirId,
      req.tenant.membershipId,
      req.tenant.permissionCodes.includes('justifications.manage'),
      dto,
    );
  }

  @Post('justifications/:justificationId/review')
  @RequirePermissions('justifications.manage')
  reviewJustification(
    @Param('choirId') choirId: string,
    @Param('justificationId') justificationId: string,
    @Req() req: any,
    @Body() dto: ReviewDto,
  ) {
    return this.justifications.reviewJustification(
      choirId,
      justificationId,
      req.tenant.membershipId,
      dto,
    );
  }

  @Get('dispensations')
  @RequirePermissions('justifications.read')
  listDispensations(@Param('choirId') choirId: string) {
    return this.justifications.listDispensations(choirId);
  }

  @Post('dispensations')
  @RequirePermissions('justifications.create')
  createDispensation(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateDispensationDto,
  ) {
    return this.justifications.createDispensation(
      choirId,
      req.tenant.membershipId,
      req.tenant.permissionCodes.includes('justifications.manage'),
      dto,
    );
  }

  @Post('dispensations/:dispensationId/review')
  @RequirePermissions('justifications.manage')
  reviewDispensation(
    @Param('choirId') choirId: string,
    @Param('dispensationId') dispensationId: string,
    @Req() req: any,
    @Body() dto: ReviewDto,
  ) {
    return this.justifications.reviewDispensation(
      choirId,
      dispensationId,
      req.tenant.membershipId,
      dto,
    );
  }
}
