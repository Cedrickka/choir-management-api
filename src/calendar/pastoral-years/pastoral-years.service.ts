import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePastoralYearDto } from './dto/create-pastoral-year.dto';
@Injectable()
export class PastoralYearsService {
  constructor(private prisma: PrismaService) {}
  list(choirId: string) {
    return this.prisma.pastoralYear.findMany({
      where: { choirId },
      orderBy: { startDate: 'desc' },
    });
  }
  async create(choirId: string, dto: CreatePastoralYearDto) {
    const startDate = new Date(dto.startDate),
      endDate = new Date(dto.endDate);
    if (startDate >= endDate)
      throw new BadRequestException('endDate must be after startDate');
    const overlap = await this.prisma.pastoralYear.findFirst({
      where: {
        choirId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap)
      throw new BadRequestException(
        'Pastoral year dates overlap an existing year',
      );
    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive)
        await tx.pastoralYear.updateMany({
          where: { choirId, isActive: true },
          data: { isActive: false },
        });
      return tx.pastoralYear.create({
        data: {
          choirId,
          name: dto.name,
          startDate,
          endDate,
          isActive: dto.isActive || false,
        },
      });
    });
  }
}
