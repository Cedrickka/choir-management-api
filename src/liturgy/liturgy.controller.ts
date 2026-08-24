import {
  Body,
  Controller,
  Get,
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
import {
  CreateMassContentDto,
  CreateMassSongbookDto,
  GenerateSongbookPublicLinkDto,
} from './dto/liturgy.dto';
import { LiturgyService } from './liturgy.service';

@ApiTags('Liturgy')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class LiturgyController {
  constructor(private readonly liturgy: LiturgyService) {}

  @Get('masses/next-liturgy')
  @RequirePermissions('calendar.read')
  next(@Param('choirId') choirId: string) {
    return this.liturgy.nextMassContent(choirId);
  }

  @Post('masses/:activityId/liturgy')
  @RequirePermissions('calendar.update')
  upsertContent(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: CreateMassContentDto,
  ) {
    return this.liturgy.upsertMassContent(
      choirId,
      activityId,
      req.tenant.membershipId,
      dto,
    );
  }

  @Get('masses/:activityId/songbooks')
  @RequirePermissions('calendar.read')
  songbooks(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.liturgy.listSongbooks(choirId, activityId);
  }

  @Post('masses/:activityId/songbook')
  @RequirePermissions('calendar.update')
  createSongbook(
    @Param('choirId') choirId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: CreateMassSongbookDto,
  ) {
    return this.liturgy.createSongbook(
      choirId,
      activityId,
      req.tenant.membershipId,
      dto,
    );
  }

  @Post('songbooks/:songbookId/public-link')
  @RequirePermissions('calendar.update')
  publicLink(
    @Param('choirId') choirId: string,
    @Param('songbookId') songbookId: string,
    @Body() dto: GenerateSongbookPublicLinkDto,
  ) {
    return this.liturgy.generatePublicLink(choirId, songbookId, dto);
  }
}

@ApiTags('Liturgy')
@Controller({ path: 'public/songbooks', version: '1' })
export class PublicSongbookController {
  constructor(private readonly liturgy: LiturgyService) {}

  @Get(':token')
  get(@Param('token') token: string) {
    return this.liturgy.publicSongbook(token);
  }
}
