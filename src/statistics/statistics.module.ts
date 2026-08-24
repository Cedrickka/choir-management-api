import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import {
  ChoirStatisticsController,
  MyStatisticsController,
} from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MyStatisticsController, ChoirStatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
