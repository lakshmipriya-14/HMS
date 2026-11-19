import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private service: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List doctors with department/designation filtering' })
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('designation') designation?: string
  ) {
    const data = await this.service.findAll(departmentId, designation);
    return {
      message: 'Doctors retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor clinical profile, schedule, and qualifications' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Doctor profile retrieved',
      data,
    };
  }
}
