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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }), LoggerModule.forRoot({ pinoHttp: { level: process.env.LOG_LEVEL || 'info', redact: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'] } }), ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), DatabaseModule, HealthModule, AuthModule, ChoirsModule],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
