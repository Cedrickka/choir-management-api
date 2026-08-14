import { BadRequestException } from '@nestjs/common';
import { PastoralYearsService } from './pastoral-years.service';
describe('PastoralYearsService', () => {
  it('rejects overlapping pastoral years', async () => {
    const prisma: any = {
      pastoralYear: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing' }),
      },
    };
    await expect(
      new PastoralYearsService(prisma).create('c', {
        name: '2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).rejects.toThrow(BadRequestException);
  });
  it('rejects reversed dates before querying', async () => {
    const prisma: any = { pastoralYear: { findFirst: jest.fn() } };
    await expect(
      new PastoralYearsService(prisma).create('c', {
        name: 'bad',
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      }),
    ).rejects.toThrow('endDate must be after');
    expect(prisma.pastoralYear.findFirst).not.toHaveBeenCalled();
  });
});
