import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InstallationsService } from './installations.service';
import { InstallationStatus } from '@prisma/client';

@ApiTags('Installations')
@ApiBearerAuth()
@Controller('installations')
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get('technicians')
  getTechnicians() {
    return this.installationsService.getTechnicians();
  }

  @Post()
  create(@Body() dto: {
    customerId: string;
    planId?: string;
    technicianId?: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
  }) {
    return this.installationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('technicianId') technicianId?: string,
    @Query('customerId') customerId?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
  ) {
    return this.installationsService.findAll({
      status, technicianId, customerId, dateStart, dateEnd, search,
      page: parseInt(page), limit: parseInt(limit),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.installationsService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InstallationStatus,
  ) {
    return this.installationsService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  assignTechnician(
    @Param('id') id: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.installationsService.assignTechnician(id, technicianId);
  }
}
