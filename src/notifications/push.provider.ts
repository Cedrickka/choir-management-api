import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export interface PushMessage {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}
export abstract class PushProvider {
  abstract send(
    message: PushMessage,
  ): Promise<{ delivered: number; failed: number }>;
}

@Injectable()
export class FirebasePushProvider extends PushProvider implements OnModuleInit {
  private readonly logger = new Logger(FirebasePushProvider.name);
  private app?: App;
  constructor(private config: ConfigService) {
    super();
  }
  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      this.logger.log(
        'Firebase push disabled: FIREBASE_PROJECT_ID is not configured',
      );
      return;
    }
    try {
      const encoded = this.config.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_BASE64',
      );
      const credential = encoded
        ? cert(JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')))
        : applicationDefault();
      this.app = getApps()[0] || initializeApp({ credential, projectId });
    } catch (error) {
      this.logger.error(
        'Firebase initialization failed; push remains disabled',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
  async send(message: PushMessage) {
    if (!this.app || !message.tokens.length) return { delivered: 0, failed: 0 };
    const result = await getMessaging(this.app).sendEachForMulticast({
      tokens: message.tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
    });
    return { delivered: result.successCount, failed: result.failureCount };
  }
}
