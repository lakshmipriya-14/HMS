import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, DoctorRoundNoteDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Doctors')
@Controller('doctors')
@Scoped()
@UseGuards(RolesGuard)
export class DoctorsController {
  constructor(private service: DoctorsService) {}

  @Get()
  @RequirePermissions('DOCTORS:VIEW')
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

  @Post()
  @RequirePermissions('DOCTORS:CREATE')
  @ApiOperation({ summary: 'Register a new doctor profile and schedule' })
  async createDoctor(
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      userId?: string;
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      branchId?: string;
      departmentId: string;
      designation: string;
      licenseNumber: string;
      specialization: string;
      subSpecialization?: string;
      experienceYears?: number;
      consultationFee?: number;
      followUpFee?: number;
      opdFee?: number;
      ipdAvailable?: boolean;
      consultationDurationMin?: number;
      availableDays?: string[];
      shift?: string;
    }
  ) {
    const data = await this.service.createDoctor(actor, dto);
    return {
      message: 'Doctor profile created successfully',
      data,
    };
  }

  @Get('inpatients')
  @RequirePermissions('DOCTORS:VIEW')
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
  @RequirePermissions('CONSULTATIONS:CREATE')
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
  @RequirePermissions('DOCTORS:VIEW')
  @ApiOperation({ summary: 'Get doctor clinical profile, schedule, and qualifications' })
  async findOne(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOne(id, actor);
    return {
      message: 'Doctor profile retrieved',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('DOCTORS:UPDATE')
  @ApiOperation({ summary: 'Update doctor profile and clinical settings' })
  async updateDoctor(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      departmentId?: string;
      designation?: string;
      specialization?: string;
      subSpecialization?: string;
      experienceYears?: number;
      consultationFee?: number;
      followUpFee?: number;
      opdFee?: number;
      ipdAvailable?: boolean;
      consultationDurationMin?: number;
      availableDays?: string[];
      shift?: string;
      isAvailableToday?: boolean;
    }
  ) {
    const data = await this.service.updateDoctor(actor, id, dto);
    return {
      message: 'Doctor profile updated successfully',
      data,
    };
  }

  @Patch(':id/schedule')
  @RequirePermissions('DOCTORS:UPDATE')
  @ApiOperation({ summary: 'Update doctor duty schedule and daily availability' })
  async updateSchedule(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { availableDays?: string[]; shift?: string; isAvailableToday?: boolean }
  ) {
    const data = await this.service.updateSchedule(actor, id, dto);
    return {
      message: 'Doctor schedule updated successfully',
      data,
    };
  }

  @Patch(':id/status')
  @RequirePermissions('DOCTORS:UPDATE')
  @ApiOperation({ summary: 'Toggle doctor active or duty status' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('status') status?: string
  ) {
    const data = await this.service.toggleDoctorStatus(actor, id, status);
    return {
      message: 'Doctor status updated successfully',
      data,
    };
  }
}
