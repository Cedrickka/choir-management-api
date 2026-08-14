import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; import { RequirePermissions } from '../common/decorators/permissions.decorator'; import { PermissionsGuard } from '../common/guards/permissions.guard'; import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import { CreateMemberDto } from './dto/create-member.dto'; import { UpdateMemberDto } from './dto/update-member.dto'; import { MembersService } from './members.service';
import { ListMembersQuery } from './dto/list-members.query';
@ApiTags('Members') @ApiBearerAuth() @Controller({ path: 'choirs/:choirId/members', version: '1' }) @UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class MembersController { constructor(private readonly members: MembersService) {}
 @Get() @RequirePermissions('members.read') list(@Param('choirId') c:string,@Query()q:ListMembersQuery){return this.members.list(c,q)}
 @Get(':membershipId') @RequirePermissions('members.read') get(@Param('choirId')c:string,@Param('membershipId')m:string){return this.members.get(c,m)}
 @Post() @RequirePermissions('members.create') create(@Param('choirId')c:string,@Body()d:CreateMemberDto){return this.members.create(c,d)}
 @Patch(':membershipId') @RequirePermissions('members.update') update(@Param('choirId')c:string,@Param('membershipId')m:string,@Body()d:UpdateMemberDto){return this.members.update(c,m,d)}
 @Delete(':membershipId') @RequirePermissions('members.archive') archive(@Param('choirId')c:string,@Param('membershipId')m:string){return this.members.archive(c,m)}
}
