import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { AdmitPatientDto, DischargePatientDto, TransferBedDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wards, Beds & Inpatient Admissions')
@Controller('wards')
export class WardsController {
  constructor(private service: WardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospital wards with bed occupancy' })
  async findAll(@CurrentUser() actor?: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.findAllWards(actor, branchId);
    return {
      message: 'Wards retrieved successfully',
      data,
    };
  }

  @Get('admissions')
  @ApiOperation({ summary: 'List active and historical IPD admissions' })
  async findAdmissions(
    @CurrentUser() actor?: AuthUserDto,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.findAdmissions(actor, patientId, status, branchId);
    return {
      message: 'Admissions retrieved successfully',
      data,
    };
  }

  @Get('admissions/:id')
  @ApiOperation({ summary: 'Get details of a specific IPD admission' })
  async findOneAdmission(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOneAdmission(id, actor);
    return {
      message: 'Admission record retrieved',
      data,
    };
  }

  @Get(':wardId/beds')
  @ApiOperation({ summary: 'Get beds and occupancy status for a ward' })
  async getBeds(@Param('wardId') wardId: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.getBeds(wardId, actor);
    return {
      message: 'Beds retrieved',
      data,
    };
  }

  @Post('admit')
  @ApiOperation({ summary: 'Admit patient and allocate bed' })
  async admitPatient(@Body() dto: AdmitPatientDto, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.admitPatient(dto, actor);
    return {
      message: 'Patient admitted and bed allocated successfully',
      data,
    };
  }

  @Post('admissions/:id/transfer')
  @ApiOperation({ summary: 'Transfer admitted patient to another ward or bed' })
  async transferBed(@Body() dto: TransferBedDto, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.transferBed(dto, actor);
    return {
      message: 'Patient bed transfer completed successfully',
      data,
    };
  }

  @Post('admissions/:id/cancel')
  @ApiOperation({ summary: 'Cancel active patient admission and release bed' })
  async cancelAdmission(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.cancelAdmission(id, reason || 'Cancelled by staff', actor);
    return {
      message: 'Admission cancelled and bed released',
      data,
    };
  }

  @Post('admissions/:id/discharge')
  @ApiOperation({ summary: 'Discharge patient and release bed for housekeeping' })
  async dischargePatient(
    @Param('id') id: string,
    @Body() dto: DischargePatientDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.dischargePatient(id, dto, actor);
    return {
      message: 'Patient discharged. Bed marked for turnover cleaning.',
      data,
    };
  }
}
