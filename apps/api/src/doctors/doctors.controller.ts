import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserDto, DoctorRoundNoteDto } from '@multispeciality-hms/contracts';
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

  @Get('inpatients')
  @ApiOperation({ summary: 'Get active admitted inpatients assigned to doctor' })
  async getInpatients(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getInpatients(actor, branchId);
    return {
      message: 'Inpatients list retrieved successfully',
      data,
    };
  }

  @Post('rounds')
  @ApiOperation({ summary: 'Record daily doctor round progress notes' })
  async recordProgressNote(
    @Body() dto: DoctorRoundNoteDto,
    @CurrentUser() actor?: AuthUserDto,
  ) {
    const data = await this.service.recordProgressNote(dto, actor);
    return {
      message: 'Doctor round progress note recorded successfully',
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
