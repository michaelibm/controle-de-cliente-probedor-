import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService } from './financial.service';

@ApiTags('Financial')
@ApiBearerAuth()
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  getSummary() {
    return this.financialService.getSummary();
  }

  @Get('statement')
  getStatement(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    return this.financialService.getStatement({
      startDate, endDate, type,
      page: parseInt(page), limit: parseInt(limit),
    });
  }

  @Post('withdrawals')
  @HttpCode(HttpStatus.CREATED)
  createWithdrawal(@Body() dto: { amount: number; description: string; withdrawnAt: string }) {
    return this.financialService.createWithdrawal(dto);
  }

  @Get('withdrawals')
  getWithdrawals(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
  ) {
    return this.financialService.getWithdrawals({
      page: parseInt(page), limit: parseInt(limit),
    });
  }
}
