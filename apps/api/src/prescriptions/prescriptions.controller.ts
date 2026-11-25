import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePrescriptionDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Prescriptions & Dispensary Queue')
@Controller('prescriptions')
@Scoped()
@UseGuards(RolesGuard)
export class PrescriptionsController {
  constructor(private service: PrescriptionsService) {}

  @Post()
  @RequirePermissions('PRESCRIPTIONS:CREATE')
  @ApiOperation({ summary: 'Create digital electronic prescription' })
  async create(@Body() dto: CreatePrescriptionDto) {
    const data = await this.service.create(dto);
    return {
      message: 'Prescription generated and sent to pharmacy queue',
      data,
    };
  }

  @Get('queue')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get active prescription queue for pharmacy' })
  async getQueue() {
    const data = await this.service.getQueue();
    return {
      message: 'Prescription dispensing queue retrieved',
      data,
    };
  }

  @Get('patient/:patientId')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get prescriptions for patient' })
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.service.findByPatient(patientId);
    return {
      message: 'Prescriptions retrieved',
      data,
    };
  }
}
