import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Appointments & Queue')
@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Book a doctor appointment and issue queue token' })
  async create(@Body() dto: CreateAppointmentDto) {
    const data = await this.service.create(dto);
    return {
      message: 'Appointment booked successfully. Token issued.',
      data,
    };
  }

  @Get('queue')
  @ApiOperation({ summary: "Get today's live appointment queue" })
  async getQueue(@Query('doctorId') doctorId?: string) {
    const data = await this.service.getTodayQueue(doctorId);
    return {
      message: "Today's queue retrieved",
      data,
    };
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's appointments for doctor or department" })
  async getToday(@Query('doctorId') doctorId?: string) {
    const data = await this.service.getTodayQueue(doctorId);
    return {
      message: 'Appointments retrieved',
      data,
    };
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in a patient on arrival at reception' })
  async checkIn(@Param('id') id: string) {
    const data = await this.service.checkIn(id);
    return {
      message: 'Patient checked in successfully',
      data,
    };
  }
}
