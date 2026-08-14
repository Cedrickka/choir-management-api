import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CreatePastoralYearDto } from './dto/create-pastoral-year.dto';
import { PastoralYearsService } from './pastoral-years.service';
@ApiTags('Calendar')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/pastoral-years', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class PastoralYearsController {
  constructor(private years: PastoralYearsService) {}
  @Get() @RequirePermissions('calendar.read') list(
    @Param('choirId') c: string,
  ) {
    return this.years.list(c);
  }
  @Post() @RequirePermissions('calendar.create') create(
    @Param('choirId') c: string,
    @Body() d: CreatePastoralYearDto,
  ) {
    return this.years.create(c, d);
  }
}
