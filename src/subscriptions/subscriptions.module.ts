import { Module } from '@nestjs/common';
import {
  ChoirSubscriptionController,
  SubscriptionPlansController,
} from './subscriptions.controller';
import { SubscriptionQuotasService } from './subscription-quotas.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionPlansController, ChoirSubscriptionController],
  providers: [SubscriptionsService, SubscriptionQuotasService],
  exports: [SubscriptionQuotasService, SubscriptionsService],
})
export class SubscriptionsModule {}
