import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterPatientDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new patient & generate UHID' })
  async register(
    @Body() dto: RegisterPatientDto,
    @CurrentUser('id') userId?: string
  ) {
    const data = await this.service.register(dto, userId);
    return {
      message: 'Patient registered successfully. UHID issued.',
      data,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name, UHID, or phone' })
  async search(
    @Query('query') query?: string,
    @Query('phone') phone?: string,
    @Query('uhid') uhid?: string
  ) {
    const data = await this.service.search(query, phone, uhid);
    return {
      message: 'Patient search results retrieved',
      data,
    };
  }

  @Get('check-duplicate')
  @ApiOperation({ summary: 'Check if patient already exists by phone/email' })
  async checkDuplicate(
    @Query('phone') phone: string,
    @Query('email') email?: string
  ) {
    const data = await this.service.checkDuplicate(phone, email);
    return {
      message: 'Duplicate check completed',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full patient clinical profile and history' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Patient record retrieved',
      data,
    };
  }
}
