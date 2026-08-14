import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
describe('ActivitiesService calendar rules', () => {
  it('never returns an activity from another choir', async () => {
    const prisma: any = {
      activity: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      new ActivitiesService(prisma).get('choir-a', 'activity-b'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.activity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'activity-b', choirId: 'choir-a' },
      }),
    );
  });
  it('keeps past occurrences immutable', async () => {
    const prisma: any = {
      activity: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            id: 'a',
            choirId: 'c',
            startsAt: new Date('2020-01-01'),
            pastoralYearId: null,
            seriesId: null,
            isSeriesOverride: false,
          }),
      },
    };
    await expect(
      new ActivitiesService(prisma).update('c', 'a', { title: 'Changed' }),
    ).rejects.toThrow(BadRequestException);
  });
  it('updates only future non-overridden series occurrences', async () => {
    const prisma: any = {
      activitySeries: { findFirst: jest.fn().mockResolvedValue({ id: 's' }) },
      activity: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    await expect(
      new ActivitiesService(prisma).updateSeries('c', 's', {
        title: 'New title',
      }),
    ).resolves.toEqual({ updatedOccurrences: 2 });
    expect(prisma.activity.updateMany).toHaveBeenCalledWith({
      where: {
        choirId: 'c',
        seriesId: 's',
        startsAt: { gt: expect.any(Date) },
        isSeriesOverride: false,
      },
      data: { title: 'New title' },
    });
  });
});
