import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConsultationsService } from './consultations.service';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, CreateConsultationDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Consultations & Clinical')
@Controller('consultations')
@Scoped()
@UseGuards(RolesGuard)
export class ConsultationsController {
  constructor(private service: ConsultationsService) {}

  @Post()
  @RequirePermissions('CONSULTATIONS:CREATE')
  @ApiOperation({ summary: 'Record clinical encounter, examination, diagnosis, and treatment plan' })
  async create(@Body() dto: CreateConsultationDto, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.create(dto, actor);
    return {
      message: 'Consultation encounter recorded successfully',
      data,
    };
  }

  @Get('patient/:patientId')
  @RequirePermissions('CONSULTATIONS:VIEW')
  @ApiOperation({ summary: 'Get consultation history for a patient' })
  async findByPatient(@Param('patientId') patientId: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findByPatient(patientId, actor);
    return {
      message: 'Consultation history retrieved',
      data,
    };
  }

  @Get('appointment/:appointmentId/draft')
  @RequirePermissions('CONSULTATIONS:VIEW')
  async draft(@Param('appointmentId') id: string, @CurrentUser() actor: AuthUserDto) {
    return { message: 'Draft loaded', data: await this.service.draft(id, actor) };
  }

  @Get('appointment/:appointmentId')
  @RequirePermissions('CONSULTATIONS:VIEW')
  async forAppointment(@Param('appointmentId') id: string, @CurrentUser() actor: AuthUserDto) {
    return { message: 'Consultation retrieved', data: await this.service.forAppointment(id, actor) };
  }

  @Post('draft')
  @RequirePermissions('CONSULTATIONS:CREATE', 'CONSULTATIONS:UPDATE')
  async saveDraft(@Body() dto: CreateConsultationDto, @CurrentUser() actor: AuthUserDto) {
    return { message: 'Draft saved', data: await this.service.saveDraft(dto, actor) };
  }

  @Post(':id/follow-ups')
  @RequirePermissions('CONSULTATIONS:VIEW', 'APPOINTMENTS:UPDATE')
  async followUp(@Param('id') id: string, @Body('date') date: unknown, @Body('time') time: unknown,
    @Body('instructions') instructions: unknown, @CurrentUser() actor: AuthUserDto) {
    return { message: 'Follow-up scheduled', data: await this.service.scheduleFollowUp(id, date, time, instructions, actor) };
  }

  @Post(':id/amendments')
  @RequirePermissions('CONSULTATIONS:UPDATE')
  async amend(@Param('id') id: string, @Body('reason') reason: unknown, @Body('note') note: unknown,
    @CurrentUser() actor: AuthUserDto) {
    return { message: 'Amendment recorded', data: await this.service.amend(id, reason, note, actor) };
  }

  @Get(':id')
  @RequirePermissions('CONSULTATIONS:VIEW')
  @ApiOperation({ summary: 'Get consultation details' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findOne(id, actor);
    return {
      message: 'Consultation details retrieved',
      data,
    };
  }
}
