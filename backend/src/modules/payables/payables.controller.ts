import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayablesService } from './payables.service';
import { CreatePayableDto, PayPayableDto, CreateCategoryDto } from './dto/payable.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payables')
@ApiBearerAuth()
@Controller('payables')
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get('categories')
  getCategories() {
    return this.payablesService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.payablesService.createCategory(dto);
  }

  @Post()
  create(@Body() dto: CreatePayableDto) {
    return this.payablesService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('dueDateStart') dueDateStart?: string,
    @Query('dueDateEnd') dueDateEnd?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
  ) {
    return this.payablesService.findAll({
      search, categoryId, status, dueDateStart, dueDateEnd,
      page: parseInt(page), limit: parseInt(limit),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payablesService.findOne(id);
  }

  @Patch(':id/pay')
  @HttpCode(HttpStatus.OK)
  pay(
    @Param('id') id: string,
    @Body() dto: PayPayableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.payablesService.pay(id, dto, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.payablesService.cancel(id);
  }
}
