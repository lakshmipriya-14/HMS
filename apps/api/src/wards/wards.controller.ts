import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WardsService } from './wards.service';
import { AdmitPatientDto, DischargePatientDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wards, Beds & Inpatient Admissions')
@Controller('wards')
export class WardsController {
  constructor(private service: WardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospital wards with bed occupancy' })
  async findAll() {
    const data = await this.service.findAllWards();
    return {
      message: 'Wards retrieved successfully',
      data,
    };
  }

  @Get(':wardId/beds')
  @ApiOperation({ summary: 'Get beds and occupancy status for a ward' })
  async getBeds(@Param('wardId') wardId: string) {
    const data = await this.service.getBeds(wardId);
    return {
      message: 'Beds retrieved',
      data,
    };
  }

  @Post('admit')
  @ApiOperation({ summary: 'Admit patient and allocate bed' })
  async admitPatient(@Body() dto: AdmitPatientDto) {
    const data = await this.service.admitPatient(dto);
    return {
      message: 'Patient admitted and bed allocated successfully',
      data,
    };
  }

  @Post('admissions/:id/discharge')
  @ApiOperation({ summary: 'Discharge patient and release bed for housekeeping' })
  async dischargePatient(
    @Param('id') id: string,
    @Body() dto: DischargePatientDto
  ) {
    const data = await this.service.dischargePatient(id, dto);
    return {
      message: 'Patient discharged. Bed marked for turnover cleaning.',
      data,
    };
  }
}
