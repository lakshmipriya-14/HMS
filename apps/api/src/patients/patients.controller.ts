import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RegisterPatientDto, Role, AuthUserDto, UpdatePatientDto } from '@multispeciality-hms/contracts';
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

  @Get('reception-appointment-requests')
  @Roles(Role.RECEPTIONIST)
  @RequirePermissions('APPOINTMENTS:CREATE')
  async receptionRequests(@CurrentUser() actor: AuthUserDto) {
    return { message: 'Appointment requests retrieved', data: await this.service.receptionRequests(actor) };
  }

  @Get('me/portal')
  @Roles(Role.PATIENT)
  async portal(@CurrentUser() actor: AuthUserDto, @Query('page') page?: string) {
    return { message: 'Patient portal retrieved', data: await this.service.portal(actor, page) };
  }

  @Get('me/doctors')
  @Roles(Role.PATIENT)
  async portalDoctors(@CurrentUser() actor: AuthUserDto, @Query('search') search?: string) {
    return { message: 'Patient portal retrieved', data: await this.service.portalDoctors(actor, search) };
  }

  @Post('me/appointment-requests')
  @Roles(Role.PATIENT)
  async requestAppointment(@CurrentUser() actor: AuthUserDto, @Body() body: { doctorId?: string; preferredDate?: string; reason?: string }) {
    return { message: 'Appointment request sent to Reception and Department Admin', data: await this.service.requestAppointment(actor, body) };
  }

  @Patch('me/photo')
  @Roles(Role.PATIENT)
  async photo(@CurrentUser() actor: AuthUserDto, @Body('photo') photo: string) {
    return { message: 'Photo updated', data: await this.service.updatePhoto(actor, photo) };
  }

  @Patch('reception/appointments/:id')
  @Roles(Role.RECEPTIONIST)
  @RequirePermissions('APPOINTMENTS:UPDATE')
  async receptionAppointmentChange(@CurrentUser() actor: AuthUserDto, @Param('id') id: string,
    @Body() body: { action?: string; date?: string; time?: string }) {
    return { message: 'Appointment updated', data: await this.service.changeAppointment(actor, id, body) };
  }

  @Patch('me/appointments/:id')
  @Roles(Role.PATIENT)
  async changeAppointment(@CurrentUser() actor: AuthUserDto, @Param('id') id: string,
    @Body() body: { action?: string; date?: string; time?: string }) {
    return { message: 'Appointment updated', data: await this.service.changeAppointment(actor, id, body) };
  }

  @Patch('me/contact')
  @Roles(Role.PATIENT)
  async updateContact(@CurrentUser() actor: AuthUserDto, @Body() body: { phone?: string; addressLine1?: string }) {
    return { message: 'Contact details updated', data: await this.service.updateOwnContact(actor, body) };
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
