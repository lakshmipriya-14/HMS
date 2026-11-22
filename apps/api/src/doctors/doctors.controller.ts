import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private service: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List doctors with department/designation filtering' })
  async findAll(
    @CurrentUser() actor?: AuthUserDto,
    @Query('departmentId') departmentId?: string,
    @Query('designation') designation?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.findAll(actor, departmentId, designation, branchId);
    return {
      message: 'Doctors retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor clinical profile, schedule, and qualifications' })
  async findOne(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOne(id, actor);
    return {
      message: 'Doctor profile retrieved',
      data,
    };
  }
}
