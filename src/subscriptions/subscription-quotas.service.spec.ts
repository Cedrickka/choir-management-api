import { BadRequestException } from '@nestjs/common';
import { SubscriptionQuotasService } from './subscription-quotas.service';

describe('SubscriptionQuotasService', () => {
  it('enforces member quotas from the active organization subscription', async () => {
    const prisma: any = {
      choir: {
        findUnique: jest.fn().mockResolvedValue({
          organization: {
            subscriptions: [
              { plan: { code: 'FREE', quotas: { members: 1 } } },
            ],
          },
        }),
      },
      membership: { count: jest.fn().mockResolvedValue(1) },
    };
    const service = new SubscriptionQuotasService(prisma);

    await expect(service.enforceMemberLimit('choir-a')).rejects.toThrow(
      BadRequestException,
    );
  });
});
