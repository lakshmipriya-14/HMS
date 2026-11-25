import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RegisterPatientDto, AuthUserDto, UpdatePatientDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Patients')
@Controller('patients')
@Scoped()
@UseGuards(RolesGuard)
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Post()
  @RequirePermissions('PATIENTS:CREATE')
  @ApiOperation({ summary: 'Register a new patient & generate UHID' })
  async register(
    @Body() dto: RegisterPatientDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.register(dto, actor);
    return {
      message: 'Patient registered successfully. UHID issued.',
      data,
    };
  }

  @Get()
  @RequirePermissions('PATIENTS:VIEW')
  @ApiOperation({ summary: 'List and search patients' })
  async findAll(
    @CurrentUser() actor?: AuthUserDto,
    @Query('search') search?: string,
    @Query('query') query?: string,
    @Query('phone') phone?: string,
    @Query('uhid') uhid?: string
  ) {
    const data = await this.service.search(search || query, phone, uhid, actor);
    return {
      message: 'Patients retrieved successfully',
      data,
    };
  }

  @Get('search')
  @RequirePermissions('PATIENTS:VIEW')
  @ApiOperation({ summary: 'Search patients by name, UHID, or phone' })
  async search(
    @CurrentUser() actor?: AuthUserDto,
    @Query('query') query?: string,
    @Query('phone') phone?: string,
    @Query('uhid') uhid?: string
  ) {
    const data = await this.service.search(query, phone, uhid, actor);
    return {
      message: 'Patient search results retrieved',
      data,
    };
  }

  @Get('check-duplicate')
  @RequirePermissions('PATIENTS:VIEW')
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
  @RequirePermissions('PATIENTS:VIEW')
  @ApiOperation({ summary: 'Get full patient clinical profile and history' })
  async findOne(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOne(id, actor);
    return {
      message: 'Patient record retrieved',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('PATIENTS:UPDATE')
  @ApiOperation({ summary: 'Update patient demographic and emergency contact details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.update(id, dto, actor);
    return {
      message: 'Patient profile updated successfully',
      data,
    };
  }
}
