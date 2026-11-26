import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NursingService } from './nursing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, CreateNursingTaskDto, RecordVitalsDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Nursing & Ward Patient Care')
@Controller('nursing')
@Scoped()
@UseGuards(RolesGuard)
export class NursingController {
  constructor(private service: NursingService) {}

  @Get('patients')
  @RequirePermissions('PATIENTS:VIEW')
  @ApiOperation({ summary: 'List admitted patients with latest vitals and active tasks' })
  async getAssignedPatients(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getAssignedPatients(actor);
    return {
      message: 'Admitted inpatient list retrieved',
      data,
    };
  }

  @Post('vitals')
  @RequirePermissions('VITALS:CREATE')
  @ApiOperation({ summary: 'Record clinical vitals with abnormal thresholds detection' })
  async recordVitals(
    @Body() dto: RecordVitalsDto,
    @CurrentUser() actor: AuthUserDto
  ) {
    const data = await this.service.recordVitals(dto, actor);
    return {
      message: data.isAbnormal
        ? 'Warning: Abnormal vitals detected and flagged for clinical review'
        : 'Vitals logged successfully',
      data,
    };
  }

  @Get('tasks')
  @RequirePermissions('NURSING_TASKS:VIEW')
  @ApiOperation({ summary: 'Get nursing care task checklist' })
  async getTasks(@Query('admissionId') admissionId?: string) {
    const data = await this.service.getTasks(admissionId);
    return {
      message: 'Nursing tasks retrieved',
      data,
    };
  }

  @Post('tasks')
  @RequirePermissions('NURSING_TASKS:CREATE')
  @ApiOperation({ summary: 'Create nursing task' })
  async createTask(@Body() dto: CreateNursingTaskDto) {
    const data = await this.service.createTask(dto);
    return {
      message: 'Nursing task scheduled',
      data,
    };
  }

  @Patch('tasks/:id/status')
  @RequirePermissions('NURSING_TASKS:UPDATE')
  @ApiOperation({ summary: 'Mark nursing task complete/pending' })
  async updateTaskStatus(
    @Param('id') id: string,
    @Body('isCompleted') isCompleted: boolean
  ) {
    const data = await this.service.updateTaskStatus(id, isCompleted);
    return {
      message: 'Task status updated',
      data,
    };
  }

  @Post('medication-administration')
  @RequirePermissions('NURSING_TASKS:UPDATE')
  @ApiOperation({ summary: 'Log medication administration event (MAR)' })
  async administerMedication(
    @Body() body: { prescriptionItemId: string; admissionId: string; dose: string; notes?: string },
    @CurrentUser('id') nurseId: string
  ) {
    const data = await this.service.administerMedication(body, nurseId);
    return {
      message: 'Medication administration recorded successfully',
      data,
    };
  }
}
