import { MessagingProviderCode } from '@prisma/client';

export type ProviderSendInput = {
  to: string;
  body: string;
  idempotencyKey: string;
};

export type ProviderSendResult = {
  provider: MessagingProviderCode;
  providerMessageId: string;
};

export interface MessagingProvider {
  sendWhatsapp(input: ProviderSendInput): Promise<ProviderSendResult>;
}

export class MockMessagingProvider implements MessagingProvider {
  async sendWhatsapp(input: ProviderSendInput): Promise<ProviderSendResult> {
    return {
      provider: MessagingProviderCode.MOCK,
      providerMessageId: `mock_${input.idempotencyKey}`,
    };
  }
}
