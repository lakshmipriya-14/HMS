import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, CreatePrescriptionDto } from '@multispeciality-hms/contracts';
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
  async create(@Body() dto: CreatePrescriptionDto, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.create(dto, actor);
    return {
      message: 'Prescription generated and sent to pharmacy queue',
      data,
    };
  }

  @Get('medicines')
  @RequirePermissions('PRESCRIPTIONS:CREATE')
  @ApiOperation({ summary: 'Search active medicines for prescribing' })
  async medicines(@Query('search') search?: string) {
    return { message: 'Medicine catalogue retrieved', data: await this.service.searchMedicines(search) };
  }

  @Get('queue')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get active prescription queue for pharmacy' })
  async getQueue(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getQueue(actor);
    return {
      message: 'Prescription dispensing queue retrieved',
      data,
    };
  }

  @Get('patient/:patientId')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get prescriptions for patient' })
  async findByPatient(@Param('patientId') patientId: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findByPatient(patientId, actor);
    return {
      message: 'Prescriptions retrieved',
      data,
    };
  }
}
