import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { validateConfig } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ChoirsModule } from './choirs/choirs.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RolesModule } from './roles/roles.module';
import { VoiceSectionsModule } from './voice-sections/voice-sections.module';
import { CalendarModule } from './calendar/calendar.module';
import { AttendanceModule } from './attendance/attendance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatisticsModule } from './statistics/statistics.module';
import { FinanceModule } from './finance/finance.module';
import { MusicModule } from './music/music.module';
import { LiturgyModule } from './liturgy/liturgy.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { JustificationsModule } from './justifications/justifications.module';
import { RsvpModule } from './rsvp/rsvp.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagingModule } from './messaging/messaging.module';
import { OfflineModule } from './offline/offline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.temporaryPassword',
          'req.body.refreshToken',
        ],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    ChoirsModule,
    OrganizationsModule,
    MembershipsModule,
    VoiceSectionsModule,
    RolesModule,
    CalendarModule,
    AttendanceModule,
    NotificationsModule,
    StatisticsModule,
    FinanceModule,
    MusicModule,
    LiturgyModule,
    AnnouncementsModule,
    SubscriptionsModule,
    JustificationsModule,
    RsvpModule,
    PaymentsModule,
    MessagingModule,
    OfflineModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
