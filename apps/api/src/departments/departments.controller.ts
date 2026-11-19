import { Controller, Get, Param, Query } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospital clinical departments' })
  async findAll(@Query('hospitalId') hospitalId?: string) {
    const data = await this.service.findAll(hospitalId);
    return {
      message: 'Departments retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department details and doctors' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Department details retrieved',
      data,
    };
  }
}
