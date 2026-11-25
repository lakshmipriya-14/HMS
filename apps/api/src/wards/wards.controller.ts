import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WardsService } from './wards.service';
import { AdmitPatientDto, DischargePatientDto, TransferBedDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wards, Beds & Inpatient Admissions')
@Controller('wards')
@Scoped()
@UseGuards(RolesGuard)
export class WardsController {
  constructor(private service: WardsService) {}

  @Get()
  @RequirePermissions('WARDS:VIEW')
  @ApiOperation({ summary: 'List all hospital wards with bed occupancy' })
  async findAll(@CurrentUser() actor?: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.findAllWards(actor, branchId);
    return {
      message: 'Wards retrieved successfully',
      data,
    };
  }

  @Get('census')
  @RequirePermissions('WARDS:VIEW')
  @ApiOperation({ summary: 'Get live bed census with department-wise utilization' })
  async getCensus(@CurrentUser() actor: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.getBedCensus(actor, branchId);
    return {
      message: 'Bed census retrieved successfully',
      data,
    };
  }

  @Get('occupancy')
  @RequirePermissions('WARDS:VIEW')
  @ApiOperation({ summary: 'Get ward occupancy and bed statistics' })
  async getOccupancy(@CurrentUser() actor: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.getBedCensus(actor, branchId);
    return {
      message: 'Ward occupancy retrieved successfully',
      data,
    };
  }

  @Get('admissions')
  @RequirePermissions('ADMISSIONS:VIEW')
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
  @RequirePermissions('ADMISSIONS:VIEW')
  @ApiOperation({ summary: 'Get details of a specific IPD admission' })
  async findOneAdmission(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOneAdmission(id, actor);
    return {
      message: 'Admission record retrieved',
      data,
    };
  }

  @Get(':wardId/beds')
  @RequirePermissions('WARDS:VIEW')
  @ApiOperation({ summary: 'Get beds and occupancy status for a ward' })
  async getBeds(@Param('wardId') wardId: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.getBeds(wardId, actor);
    return {
      message: 'Beds retrieved',
      data,
    };
  }

  @Post('admit')
  @RequirePermissions('ADMISSIONS:CREATE')
  @ApiOperation({ summary: 'Admit patient and allocate bed' })
  async admitPatient(@Body() dto: AdmitPatientDto, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.admitPatient(dto, actor);
    return {
      message: 'Patient admitted and bed allocated successfully',
      data,
    };
  }

  @Post('admissions/:id/transfer')
  @RequirePermissions('ADMISSIONS:UPDATE')
  @ApiOperation({ summary: 'Transfer admitted patient to another ward or bed' })
  async transferBed(@Body() dto: TransferBedDto, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.transferBed(dto, actor);
    return {
      message: 'Patient bed transfer completed successfully',
      data,
    };
  }

  @Post('admissions/:id/cancel')
  @RequirePermissions('ADMISSIONS:UPDATE')
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
  @RequirePermissions('ADMISSIONS:UPDATE')
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

  @Post()
  @RequirePermissions('WARDS:CREATE')
  @ApiOperation({ summary: 'Create new hospital ward' })
  async createWard(
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      name: string;
      code: string;
      genderAllowed?: string;
      floorNumber?: number;
      departmentId?: string;
      branchId?: string;
    }
  ) {
    const data = await this.service.createWard(actor, dto);
    return {
      message: 'Ward created successfully',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('WARDS:UPDATE')
  @ApiOperation({ summary: 'Update ward configuration' })
  async updateWard(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      name?: string;
      genderAllowed?: string;
      floorNumber?: number;
      departmentId?: string;
    }
  ) {
    const data = await this.service.updateWard(actor, id, dto);
    return {
      message: 'Ward updated successfully',
      data,
    };
  }

  @Post(':wardId/beds')
  @RequirePermissions('BEDS:CREATE')
  @ApiOperation({ summary: 'Add a new bed to a ward' })
  async createBed(
    @Param('wardId') wardId: string,
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      roomNumber: string;
      bedNumber: string;
      type?: string;
      dailyRate?: number;
      status?: string;
    }
  ) {
    const data = await this.service.createBed(actor, wardId, dto);
    return {
      message: 'Bed added to ward successfully',
      data,
    };
  }

  @Patch('beds/:bedId/status')
  @RequirePermissions('BEDS:UPDATE')
  @ApiOperation({ summary: 'Update bed status (AVAILABLE, MAINTENANCE, CLEANING, RESERVED)' })
  async updateBedStatus(
    @Param('bedId') bedId: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('status') status: string
  ) {
    const data = await this.service.updateBedStatus(actor, bedId, status);
    return {
      message: 'Bed status updated successfully',
      data,
    };
  }
}
