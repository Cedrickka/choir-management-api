import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FinanceController, MyFinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MyFinanceController, FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
