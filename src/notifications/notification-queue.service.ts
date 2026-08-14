import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private queue?: Queue;
  private logger = new Logger(NotificationQueueService.name);
  constructor(private config: ConfigService) {}
  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('BullMQ disabled: REDIS_URL is not configured');
      return;
    }
    this.queue = new Queue('notifications', { connection: { url } });
  }
  async wake(jobId: string, scheduledAt: Date) {
    if (!this.queue) return;
    await this.queue.add(
      'dispatch',
      { jobId },
      {
        jobId,
        delay: Math.max(0, scheduledAt.getTime() - Date.now()),
        attempts: 3,
        removeOnComplete: 1000,
      },
    );
  }
  async onModuleDestroy() {
    await this.queue?.close();
  }
}
