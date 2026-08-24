import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateMessagingTemplateDto,
  SendWhatsappDto,
} from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/messaging/whatsapp', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get('templates')
  @RequirePermissions('messaging.read')
  listTemplates(@Param('choirId') choirId: string) {
    return this.messaging.listTemplates(choirId);
  }

  @Post('templates')
  @RequirePermissions('messaging.manage')
  createTemplate(
    @Param('choirId') choirId: string,
    @Body() dto: CreateMessagingTemplateDto,
  ) {
    return this.messaging.createTemplate(choirId, dto);
  }

  @Get('attempts')
  @RequirePermissions('messaging.read')
  listAttempts(@Param('choirId') choirId: string) {
    return this.messaging.listAttempts(choirId);
  }

  @Post('send')
  @RequirePermissions('messaging.manage')
  send(@Param('choirId') choirId: string, @Body() dto: SendWhatsappDto) {
    return this.messaging.sendWhatsapp(choirId, dto);
  }
}
