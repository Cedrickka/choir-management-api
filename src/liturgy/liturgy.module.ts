import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import {
  LiturgyController,
  PublicSongbookController,
} from './liturgy.controller';
import { LiturgyService } from './liturgy.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LiturgyController, PublicSongbookController],
  providers: [LiturgyService],
})
export class LiturgyModule {}
