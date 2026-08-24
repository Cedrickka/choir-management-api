import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  MyStatisticsQueryDto,
  StatisticsQueryDto,
} from './dto/statistics-query.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({ path: 'me/statistics', version: '1' })
@UseGuards(JwtAuthGuard)
export class MyStatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get()
  @ApiOkResponse({ description: 'Statistiques personnelles du choriste.' })
  get(@Req() req: any, @Query() query: MyStatisticsQueryDto) {
    return this.statistics.myStatistics(req.user.id, query);
  }
}

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/statistics', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class ChoirStatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get()
  @RequirePermissions('attendance.read')
  @ApiOkResponse({ description: 'Synthèse statistique globale de la chorale.' })
  summary(
    @Param('choirId') choirId: string,
    @Query() query: StatisticsQueryDto,
  ) {
    return this.statistics.choirSummary(choirId, query);
  }

  @Get('members')
  @RequirePermissions('attendance.read')
  @ApiOkResponse({ description: 'Statistiques individuelles des membres.' })
  members(
    @Param('choirId') choirId: string,
    @Query() query: StatisticsQueryDto,
  ) {
    return this.statistics.memberStatistics(choirId, query);
  }

  @Get('export.csv')
  @RequirePermissions('attendance.read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(
    @Param('choirId') choirId: string,
    @Query() query: StatisticsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="choir-statistics.csv"',
    );
    return this.statistics.exportMembersCsv(choirId, query);
  }
}
