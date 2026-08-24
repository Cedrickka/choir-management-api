import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MusicController],
  providers: [MusicService],
})
export class MusicModule {}
