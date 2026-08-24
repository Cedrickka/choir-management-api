import { OfflineService } from './offline.service';

describe('OfflineService', () => {
  it('does not duplicate a synchronized client event', async () => {
    const existing = { id: 'sync-1', status: 'RECEIVED' };
    const prisma: any = {
      offlineDevice: {
        findFirst: jest.fn().mockResolvedValue({ id: 'device-1' }),
      },
      offlineSyncEvent: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
    };
    const service = new OfflineService(prisma);

    await expect(
      service.syncEvent('choir-a', {
        deviceIdentifier: 'tablet-1',
        clientEventId: 'event-1',
        type: 'ATTENDANCE_SCAN',
        localTimestamp: '2026-09-01T10:00:00Z',
        payload: { activityId: 'activity-1' },
      }),
    ).resolves.toEqual({ status: 'DUPLICATE', event: existing });
    expect(prisma.offlineSyncEvent.create).not.toHaveBeenCalled();
  });
});
