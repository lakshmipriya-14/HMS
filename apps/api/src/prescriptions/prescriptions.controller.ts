import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Prescriptions & Dispensary Queue')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private service: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create digital electronic prescription' })
  async create(@Body() dto: CreatePrescriptionDto) {
    const data = await this.service.create(dto);
    return {
      message: 'Prescription generated and sent to pharmacy queue',
      data,
    };
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get active prescription queue for pharmacy' })
  async getQueue() {
    const data = await this.service.getQueue();
    return {
      message: 'Prescription dispensing queue retrieved',
      data,
    };
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get prescriptions for patient' })
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.service.findByPatient(patientId);
    return {
      message: 'Prescriptions retrieved',
      data,
    };
  }
}
