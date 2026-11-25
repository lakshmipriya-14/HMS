import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateConsultationDto } from '@multispeciality-hms/contracts';
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
  async create(@Body() dto: CreateConsultationDto) {
    const data = await this.service.create(dto);
    return {
      message: 'Consultation encounter recorded successfully',
      data,
    };
  }

  @Get('patient/:patientId')
  @RequirePermissions('CONSULTATIONS:VIEW')
  @ApiOperation({ summary: 'Get consultation history for a patient' })
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.service.findByPatient(patientId);
    return {
      message: 'Consultation history retrieved',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('CONSULTATIONS:VIEW')
  @ApiOperation({ summary: 'Get consultation details' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Consultation details retrieved',
      data,
    };
  }
}
