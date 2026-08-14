import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('cancels a late reminder when arrival already exists', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const update = jest.fn().mockResolvedValue({});
    const prisma: any = {
      notificationJob: {
        updateMany,
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({
            id: 'job',
            trigger: 'LATE_ARRIVAL',
            activityId: 'activity',
            membershipId: 'member',
            membership: { userId: 'user' },
          }),
        update,
      },
      attendance: {
        findUnique: jest.fn().mockResolvedValue({ id: 'attendance' }),
      },
    };
    const service = new NotificationsService(
      prisma,
      { send: jest.fn() } as any,
      { wake: jest.fn() } as any,
    );
    await service.dispatch('job');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'job' },
      data: { status: 'CANCELLED' },
    });
  });

  it('ignores a duplicate worker after atomic claiming', async () => {
    const prisma: any = {
      notificationJob: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUniqueOrThrow: jest.fn(),
      },
    };
    const service = new NotificationsService(
      prisma,
      { send: jest.fn() } as any,
      { wake: jest.fn() } as any,
    );
    await service.dispatch('same-job');
    expect(prisma.notificationJob.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
