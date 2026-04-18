import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReceivablesService } from './receivables.service';
import {
  CreateReceivableDto, PayReceivableDto, RenegotiateReceivableDto,
} from './dto/create-receivable.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Receivables')
@ApiBearerAuth()
@Controller('receivables')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  @Roles(UserRole.FINANCIAL)
  @ApiOperation({ summary: 'Criar cobrança manual' })
  create(@Body() dto: CreateReceivableDto) {
    return this.receivablesService.create(dto);
  }

  @Post('generate-monthly')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar mensalidades para contratos ativos' })
  generateMonthly() {
    return this.receivablesService.generateMonthly();
  }

  @Post('generate-annual/:contractId')
  @Roles(UserRole.FINANCIAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar 12 mensalidades para um contrato específico' })
  generateAnnual(@Param('contractId') contractId: string) {
    return this.receivablesService.generateAnnual(contractId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cobranças com filtros avançados' })
  findAll(
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('planId') planId?: string,
    @Query('city') city?: string,
    @Query('dueDateStart') dueDateStart?: string,
    @Query('dueDateEnd') dueDateEnd?: string,
    @Query('paidDateStart') paidDateStart?: string,
    @Query('paidDateEnd') paidDateEnd?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('dueToday') dueToday?: string,
    @Query('dueThisWeek') dueThisWeek?: string,
    @Query('paidToday') paidToday?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('orderBy') orderBy = 'dueDate',
    @Query('order') order = 'asc',
  ) {
    return this.receivablesService.findAll({
      search, customerId, contractId, status, paymentMethod, planId, city,
      dueDateStart, dueDateEnd, paidDateStart, paidDateEnd,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      dueToday: dueToday === 'true',
      dueThisWeek: dueThisWeek === 'true',
      paidToday: paidToday === 'true',
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy, order,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da cobrança' })
  findOne(@Param('id') id: string) {
    return this.receivablesService.findOne(id);
  }

  @Patch(':id/pay')
  @Roles(UserRole.FINANCIAL)
  @ApiOperation({ summary: 'Dar baixa na cobrança' })
  pay(
    @Param('id') id: string,
    @Body() dto: PayReceivableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.receivablesService.pay(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.FINANCIAL)
  @ApiOperation({ summary: 'Cancelar cobrança' })
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.receivablesService.cancel(id, reason);
  }

  @Patch(':id/renegotiate')
  @Roles(UserRole.FINANCIAL)
  @ApiOperation({ summary: 'Renegociar cobrança' })
  renegotiate(@Param('id') id: string, @Body() dto: RenegotiateReceivableDto) {
    return this.receivablesService.renegotiate(id, dto);
  }

  @Patch(':id/due-date')
  @Roles(UserRole.FINANCIAL)
  @ApiOperation({ summary: 'Alterar vencimento' })
  updateDueDate(@Param('id') id: string, @Body('newDueDate') newDueDate: string) {
    return this.receivablesService.updateDueDate(id, newDueDate);
  }

  @Post('sync')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar pagamentos pendentes com o Asaas' })
  syncWithAsaas() {
    return this.receivablesService.syncWithAsaas();
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir múltiplas cobranças (soft delete)' })
  removeMany(@Body('ids') ids: string[]) {
    return this.receivablesService.removeMany(ids);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir cobrança (soft delete)' })
  remove(@Param('id') id: string) {
    return this.receivablesService.remove(id);
  }
}
