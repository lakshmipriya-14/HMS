import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, DoctorRoundNoteDto, RequestDoctorLeaveDto, Role } from '@multispeciality-hms/contracts';
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
  @Roles(Role.DOCTOR)
  @RequirePermissions('ADMISSIONS:VIEW')
  @ApiOperation({ summary: 'Get active admitted inpatients assigned to doctor' })
  async getInpatients(
    @CurrentUser() actor: AuthUserDto,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getInpatients(actor, branchId);
    return {
      message: 'Inpatients list retrieved successfully',
      data,
    };
  }

  @Post('rounds')
  @Roles(Role.DOCTOR)
  @RequirePermissions('CONSULTATIONS:CREATE', 'ADMISSIONS:VIEW')
  @ApiOperation({ summary: 'Record daily doctor round progress notes' })
  async recordProgressNote(
    @Body() dto: DoctorRoundNoteDto,
    @CurrentUser() actor: AuthUserDto,
  ) {
    const data = await this.service.recordProgressNote(dto, actor);
    return {
      message: 'Doctor round progress note recorded successfully',
      data,
    };
  }

  @Get('me/workspace')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Read the signed-in doctor profile, schedule and permitted statistics' })
  async workspace(@CurrentUser() actor: AuthUserDto) {
    return { message: 'Doctor workspace retrieved successfully', data: await this.service.workspace(actor) };
  }

  @Get('me/patients/:id/history')
  @Roles(Role.DOCTOR)
  @RequirePermissions('PATIENTS:VIEW')
  @ApiOperation({ summary: 'Read the scoped history of a patient assigned to the signed-in doctor' })
  async patientHistory(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    return { message: 'Patient history retrieved', data: await this.service.patientHistory(actor, id) };
  }

  @Post('me/leaves')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Request leave for the signed-in doctor' })
  async requestLeave(@CurrentUser() actor: AuthUserDto, @Body() dto: RequestDoctorLeaveDto) {
    return { message: 'Leave requested', data: await this.service.requestLeave(actor, dto) };
  }

  @Patch('me/schedules/:id')
  @Roles(Role.DOCTOR)
  async editWorkingHours(@Param('id') id: string, @CurrentUser() actor: AuthUserDto,
    @Body() dto: { startTime: string; endTime: string }) {
    return { message: 'Working hours updated', data: await this.service.editWorkingHours(actor, id, dto) };
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
