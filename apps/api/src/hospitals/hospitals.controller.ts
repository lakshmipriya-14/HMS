import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Hospitals & Organization')
@Controller('hospitals')
export class HospitalsController {
  constructor(private service: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospitals and branches' })
  async findAll() {
    const hospitals = await this.service.findAll();
    return {
      message: 'Hospitals retrieved successfully',
      data: hospitals,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details' })
  async findOne(@Param('id') id: string) {
    const hospital = await this.service.findOne(id);
    return {
      message: 'Hospital details retrieved',
      data: hospital,
    };
  }
}
