import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractStatus, UserRole } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Criar contrato' })
  create(@Body() dto: CreateContractDto, @CurrentUser('id') userId: string) {
    return this.contractsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos com filtros' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: ContractStatus,
    @Query('planId') planId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
  ) {
    return this.contractsService.findAll({
      customerId, status, planId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do contrato' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de status do contrato' })
  getHistory(@Param('id') id: string) {
    return this.contractsService.getHistory(id);
  }

  @Put(':id')
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Atualizar contrato' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateContractDto>) {
    return this.contractsService.update(id, dto);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Suspender contrato' })
  suspend(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.contractsService.suspend(id, userId, reason);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancelar contrato' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.contractsService.cancel(id, userId, reason);
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Reativar contrato' })
  reactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contractsService.reactivate(id, userId);
  }
}
