import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CustomerStatus, UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Criar cliente' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get('backup')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar backup completo dos dados' })
  exportBackup() {
    return this.customersService.exportBackup();
  }

  @Post('backup/import')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importar backup de dados' })
  importBackup(@Body() payload: any) {
    return this.customersService.importBackup(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes com filtros' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CustomerStatus })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'neighborhood', required: false })
  @ApiQuery({ name: 'isDefaulting', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: CustomerStatus,
    @Query('city') city?: string,
    @Query('neighborhood') neighborhood?: string,
    @Query('sellerId') sellerId?: string,
    @Query('isDefaulting') isDefaulting?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('orderBy') orderBy = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ) {
    return this.customersService.findAll({
      search, status, city, neighborhood, sellerId,
      isDefaulting: isDefaulting === 'true',
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy, order,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do cliente' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/financial-summary')
  @ApiOperation({ summary: 'Resumo financeiro do cliente' })
  getFinancialSummary(@Param('id') id: string) {
    return this.customersService.getFinancialSummary(id);
  }

  @Put(':id')
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ATTENDANT)
  @ApiOperation({ summary: 'Alterar status do cliente' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: CustomerStatus,
    @Body('reason') reason?: string,
  ) {
    return this.customersService.updateStatus(id, status, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover cliente (soft delete)' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
