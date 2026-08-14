import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ListMembersQuery } from './dto/list-members.query';

const memberInclude = { user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, status: true } }, profile: { include: { voiceSection: true } }, roles: { include: { role: true } } } as const;
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}
  async list(choirId: string, query:ListMembersQuery) { const where={choirId,archivedAt:null,...(query.search?{user:{OR:[{firstName:{contains:query.search,mode:'insensitive' as const}},{lastName:{contains:query.search,mode:'insensitive' as const}},{email:{contains:query.search,mode:'insensitive' as const}}]}}:{})};const [data,total]=await this.prisma.$transaction([this.prisma.membership.findMany({where,include:memberInclude,orderBy:{createdAt:'desc'},skip:(query.page-1)*query.limit,take:query.limit}),this.prisma.membership.count({where})]);return {data,meta:{page:query.page,limit:query.limit,total,totalPages:Math.ceil(total/query.limit)}}; }
  async get(choirId: string, membershipId: string) { const row = await this.prisma.membership.findFirst({ where: { id: membershipId, choirId, archivedAt: null }, include: memberInclude }); if (!row) throw new NotFoundException('Member not found'); return row; }
  async create(choirId: string, dto: CreateMemberDto) {
    if (!dto.email && !dto.phone) throw new ConflictException('Email or phone is required');
    const choir = await this.prisma.choir.findUnique({ where: { id: choirId }, select: { organizationId: true } }); if (!choir) throw new NotFoundException('Choir not found');
    if (dto.voiceSectionId && !await this.prisma.voiceSection.findFirst({ where: { id: dto.voiceSectionId, choirId } })) throw new NotFoundException('Voice section not found');
    const identities = [...(dto.email ? [{ email: dto.email.toLowerCase() }] : []), ...(dto.phone ? [{ phone: dto.phone }] : [])];
    const existing = await this.prisma.user.findFirst({ where: { OR: identities } });
    if (existing && await this.prisma.membership.findUnique({ where: { userId_choirId: { userId: existing.id, choirId } } })) throw new ConflictException('Member already belongs to this choir');
    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);
    return this.prisma.$transaction(async tx => {
      const user = existing || await tx.user.create({ data: { email: dto.email?.toLowerCase(), phone: dto.phone, firstName: dto.firstName, lastName: dto.lastName, passwordHash } });
      const membership = await tx.membership.create({ data: { userId: user.id, choirId, profile: { create: { postName: dto.postName, functionTitle: dto.functionTitle, voiceSectionId: dto.voiceSectionId, joinedChoirAt: new Date() } } } });
      const role = await tx.role.findFirst({ where: { organizationId: choir.organizationId, code: 'MEMBER' } }); if (role) await tx.membershipRole.create({ data: { membershipId: membership.id, roleId: role.id } });
      if (dto.voiceSectionId) await tx.voiceSectionAssignment.create({ data: { membershipId: membership.id, voiceSectionId: dto.voiceSectionId } });
      return tx.membership.findUnique({ where: { id: membership.id }, include: memberInclude });
    });
  }
  async update(choirId: string, membershipId: string, dto: UpdateMemberDto) {
    await this.get(choirId, membershipId);
    if (dto.voiceSectionId && !await this.prisma.voiceSection.findFirst({ where: { id: dto.voiceSectionId, choirId } })) throw new NotFoundException('Voice section not found');
    const { birthDate, voiceSectionId, ...rest } = dto;
    return this.prisma.$transaction(async tx => {
      if (voiceSectionId) { await tx.voiceSectionAssignment.updateMany({ where: { membershipId, endsAt: null }, data: { endsAt: new Date() } }); await tx.voiceSectionAssignment.create({ data: { membershipId, voiceSectionId } }); }
      await tx.memberProfile.upsert({ where: { membershipId }, update: { ...rest, birthDate: birthDate ? new Date(birthDate) : undefined, voiceSectionId }, create: { membershipId, ...rest, birthDate: birthDate ? new Date(birthDate) : undefined, voiceSectionId } });
      return tx.membership.findUnique({ where: { id: membershipId }, include: memberInclude });
    });
  }
  async archive(choirId: string, membershipId: string) { await this.get(choirId, membershipId); await this.prisma.membership.update({ where: { id: membershipId }, data: { status: 'INACTIVE', archivedAt: new Date() } }); return { archived: true }; }
}
