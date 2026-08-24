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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateSongDto,
  CreateSongRehearsalDto,
  CreateSongTrackDto,
  ListSongsQueryDto,
  UpdateSongMasteryDto,
} from './dto/music.dto';
import { MusicService } from './music.service';

@ApiTags('Music')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/songs', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class MusicController {
  constructor(private readonly music: MusicService) {}

  @Get()
  @RequirePermissions('music.read')
  list(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Query() query: ListSongsQueryDto,
  ) {
    return this.music.listSongs(choirId, query, req.tenant.membershipId);
  }

  @Post()
  @RequirePermissions('music.manage')
  create(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateSongDto,
  ) {
    return this.music.createSong(choirId, req.tenant.membershipId, dto);
  }

  @Get(':songId')
  @RequirePermissions('music.read')
  get(
    @Param('choirId') choirId: string,
    @Param('songId') songId: string,
    @Req() req: any,
  ) {
    return this.music.getSong(
      choirId,
      songId,
      req.tenant.membershipId,
      req.tenant.permissionCodes.includes('music.manage'),
    );
  }

  @Get(':songId/tracks')
  @RequirePermissions('music.read')
  tracks(
    @Param('choirId') choirId: string,
    @Param('songId') songId: string,
    @Req() req: any,
  ) {
    return this.music.listTracks(
      choirId,
      songId,
      req.tenant.membershipId,
      req.tenant.permissionCodes.includes('music.manage'),
    );
  }

  @Post(':songId/tracks')
  @RequirePermissions('music.manage')
  createTrack(
    @Param('choirId') choirId: string,
    @Param('songId') songId: string,
    @Body() dto: CreateSongTrackDto,
  ) {
    return this.music.createTrack(choirId, songId, dto);
  }

  @Post(':songId/rehearsals')
  @RequirePermissions('music.manage')
  addRehearsal(
    @Param('choirId') choirId: string,
    @Param('songId') songId: string,
    @Req() req: any,
    @Body() dto: CreateSongRehearsalDto,
  ) {
    return this.music.addRehearsal(
      choirId,
      songId,
      req.tenant.membershipId,
      dto,
    );
  }

  @Patch(':songId/mastery/:voiceSectionId')
  @RequirePermissions('music.manage')
  updateMastery(
    @Param('choirId') choirId: string,
    @Param('songId') songId: string,
    @Param('voiceSectionId') voiceSectionId: string,
    @Req() req: any,
    @Body() dto: UpdateSongMasteryDto,
  ) {
    return this.music.updateMastery(
      choirId,
      songId,
      voiceSectionId,
      req.tenant.membershipId,
      dto,
    );
  }
}
