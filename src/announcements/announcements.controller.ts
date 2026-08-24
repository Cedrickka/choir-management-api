import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateAnnouncementDto,
  ListAnnouncementsQueryDto,
} from './dto/announcement.dto';
import { AnnouncementsService } from './announcements.service';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/announcements', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @RequirePermissions('notifications.read')
  list(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Query() query: ListAnnouncementsQueryDto,
  ) {
    return this.announcements.listForMember(
      choirId,
      req.tenant.membershipId,
      query,
      req.tenant.permissionCodes.includes('announcements.manage'),
    );
  }

  @Post()
  @RequirePermissions('announcements.manage')
  create(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcements.create(choirId, req.tenant.membershipId, dto);
  }

  @Post(':announcementId/read')
  @RequirePermissions('notifications.read')
  markRead(
    @Param('choirId') choirId: string,
    @Param('announcementId') announcementId: string,
    @Req() req: any,
  ) {
    return this.announcements.markRead(
      choirId,
      announcementId,
      req.tenant.membershipId,
    );
  }

  @Get(':announcementId/read-receipts')
  @RequirePermissions('announcements.manage')
  receipts(
    @Param('choirId') choirId: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcements.receipts(choirId, announcementId);
  }
}
