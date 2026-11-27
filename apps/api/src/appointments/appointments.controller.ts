import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthUserDto, CreateAppointmentDto, RescheduleAppointmentDto, CancelAppointmentDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Appointments & Queue')
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Post()
  @Scoped()
  @RequirePermissions('APPOINTMENTS:CREATE')
  @ApiOperation({ summary: 'Book a doctor appointment and issue queue token' })
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.create(dto, actor);
    return {
      message: 'Appointment booked successfully. Token issued.',
      data,
    };
  }

  @Get('booking-options')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:CREATE')
  @ApiOperation({ summary: 'Get scoped branches, departments, and doctors for appointment booking' })
  async getBookingOptions(
    @CurrentUser() actor: AuthUserDto,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getBookingOptions(actor, branchId);
    return {
      message: 'Booking options retrieved successfully',
      data,
    };
  }

  @Get('slots')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:VIEW')
  @ApiOperation({ summary: 'Get doctor slot availability for a date' })
  async getSlots(
    @CurrentUser() actor: AuthUserDto,
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getAvailableSlots(actor, doctorId, date, branchId);
    return {
      message: 'Available time slots retrieved successfully',
      data,
    };
  }

  @Get()
  @Scoped()
  @RequirePermissions('APPOINTMENTS:VIEW')
  @ApiOperation({ summary: 'List and filter appointments' })
  async findAll(
    @CurrentUser() actor: AuthUserDto,
    @Query('date') date?: string,
    @Query('departmentId') departmentId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.findAll(actor, {
      date,
      departmentId,
      doctorId,
      status,
      search,
      requestedBranchId: branchId,
    });
    return {
      message: 'Appointments retrieved successfully',
      data,
    };
  }

  @Get('queue')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:VIEW')
  @ApiOperation({ summary: "Get today's live appointment queue" })
  async getQueue(
    @CurrentUser() actor: AuthUserDto,
    @Query('doctorId') doctorId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getTodayQueue(actor, doctorId, branchId);
    return {
      message: "Today's queue retrieved",
      data,
    };
  }

  @Get('today')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:VIEW')
  @ApiOperation({ summary: "Get today's appointments for doctor or department" })
  async getToday(
    @CurrentUser() actor: AuthUserDto,
    @Query('doctorId') doctorId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getTodayQueue(actor, doctorId, branchId);
    return {
      message: 'Appointments retrieved',
      data,
    };
  }

  @Post(':id/start-consultation')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:UPDATE', 'CONSULTATIONS:CREATE')
  @ApiOperation({ summary: 'Start a checked-in appointment as its assigned doctor' })
  async startConsultation(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.startConsultation(id, actor);
    return { message: 'Consultation started', data };
  }

  @Post(':id/check-in')
  @Scoped()
  @RequirePermissions('APPOINTMENTS:UPDATE')
  @ApiOperation({ summary: 'Check in a patient on arrival at reception' })
  async checkIn(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.checkIn(id, actor);
    return {
      message: 'Patient checked in successfully',
      data,
    };
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment date and time slot' })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto
  ) {
    const data = await this.service.reschedule(id, dto.appointmentDate, dto.appointmentTime);
    return {
      message: 'Appointment rescheduled successfully',
      data,
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto
  ) {
    const data = await this.service.cancel(id, dto.reason);
    return {
      message: 'Appointment cancelled',
      data,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment queue status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const data = await this.service.updateStatus(id, status);
    return {
      message: `Appointment status updated to ${status}`,
      data,
    };
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointment history for a patient' })
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.service.findByPatient(patientId);
    return {
      message: 'Patient appointment history retrieved',
      data,
    };
  }
}
