import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('returns an existing transaction for the same idempotency key', async () => {
    const existing = { id: 'tx-1', allocations: [] };
    const prisma: any = {
      paymentTransaction: { findUnique: jest.fn().mockResolvedValue(existing) },
    };
    const service = new PaymentsService(prisma, { get: jest.fn() } as any);

    await expect(
      service.createTransaction('choir-a', 'member-a', {
        provider: 'MOCK',
        idempotencyKey: 'idem-1',
        currency: 'CDF',
        allocations: [{ obligationId: 'obligation-a', amount: 10 }],
      }),
    ).resolves.toBe(existing);
  });

  it('rejects unsigned webhooks in production and records the attempt', async () => {
    const prisma: any = {
      paymentWebhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      },
    };
    const config: any = {
      get: jest.fn((key: string) =>
        key === 'NODE_ENV' ? 'production' : '',
      ),
    };
    const service = new PaymentsService(prisma, config);

    await expect(
      service.handleWebhook('MOCK', {
        eventId: 'evt-1',
        internalReference: 'pay-1',
        status: 'SUCCEEDED',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ signatureValid: false }),
      }),
    );
  });
});
