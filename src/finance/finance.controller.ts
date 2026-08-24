import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { TenantAccessGuard } from '../common/guards/tenant-access.guard';
import {
  CreateContributionDto,
  CreateContributionPaymentDto,
  CreateFinanceExpenseDto,
  CreateFinanceFundDto,
  CreateFinanceIncomeDto,
  FinanceReportQueryDto,
  MyFinanceQueryDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller({ path: 'me/finance', version: '1' })
@UseGuards(JwtAuthGuard)
export class MyFinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get()
  situation(@Req() req: any, @Query() query: MyFinanceQueryDto) {
    return this.finance.mySituation(req.user.id, query);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller({ path: 'choirs/:choirId/finance', version: '1' })
@UseGuards(JwtAuthGuard, TenantAccessGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('funds')
  @RequirePermissions('finance.read')
  listFunds(@Param('choirId') choirId: string) {
    return this.finance.listFunds(choirId);
  }

  @Post('funds')
  @RequirePermissions('finance.manage')
  createFund(
    @Param('choirId') choirId: string,
    @Body() dto: CreateFinanceFundDto,
  ) {
    return this.finance.createFund(choirId, dto);
  }

  @Get('contributions')
  @RequirePermissions('finance.read')
  listContributions(@Param('choirId') choirId: string) {
    return this.finance.listContributions(choirId);
  }

  @Post('contributions')
  @RequirePermissions('finance.manage')
  createContribution(
    @Param('choirId') choirId: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.finance.createContribution(choirId, dto);
  }

  @Post('payments')
  @RequirePermissions('finance.manage')
  payContribution(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateContributionPaymentDto,
  ) {
    return this.finance.payContribution(choirId, req.tenant.membershipId, dto);
  }

  @Post('incomes')
  @RequirePermissions('finance.manage')
  createIncome(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateFinanceIncomeDto,
  ) {
    return this.finance.createIncome(choirId, req.tenant.membershipId, dto);
  }

  @Post('expenses')
  @RequirePermissions('finance.manage')
  createExpense(
    @Param('choirId') choirId: string,
    @Req() req: any,
    @Body() dto: CreateFinanceExpenseDto,
  ) {
    return this.finance.createExpense(choirId, req.tenant.membershipId, dto);
  }

  @Get('reports')
  @RequirePermissions('finance.read')
  report(
    @Param('choirId') choirId: string,
    @Query() query: FinanceReportQueryDto,
  ) {
    return this.finance.report(choirId, query);
  }
}
