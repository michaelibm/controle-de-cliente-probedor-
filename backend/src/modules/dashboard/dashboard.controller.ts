import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Cards principais do dashboard' })
  getSummary(@Query('period') period?: string) {
    return this.dashboardService.getSummary(period);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Gráfico de receitas por dia' })
  getRevenueChart(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRevenueChart(startDate, endDate);
  }

  @Get('monthly-comparison')
  @ApiOperation({ summary: 'Comparativo mensal do ano' })
  getMonthlyComparison() {
    return this.dashboardService.getMonthlyComparison();
  }

  @Get('status-breakdown')
  @ApiOperation({ summary: 'Distribuição por status' })
  getStatusBreakdown() {
    return this.dashboardService.getStatusBreakdown();
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Distribuição por forma de pagamento' })
  getPaymentMethods(@Query('period') period?: string) {
    return this.dashboardService.getPaymentMethodBreakdown(period);
  }

  @Get('top-defaulters')
  @ApiOperation({ summary: 'Ranking de maiores inadimplentes' })
  getTopDefaulters(@Query('limit') limit = '10') {
    return this.dashboardService.getTopDefaulters(parseInt(limit));
  }

  @Get('upcoming-due')
  @ApiOperation({ summary: 'Cobranças próximas do vencimento' })
  getUpcomingDue(@Query('days') days = '7') {
    return this.dashboardService.getUpcomingDue(parseInt(days));
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertas do dia' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
