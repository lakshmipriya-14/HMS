import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { AdmitPatientDto, DischargePatientDto, AuthUserDto } from '@multispeciality-hms/contracts';
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
