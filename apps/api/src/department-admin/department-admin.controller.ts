import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DepartmentAdminService } from './department-admin.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Department Admin')
@Controller('department-admin')
@Scoped()
@UseGuards(RolesGuard)
@Roles(Role.DEPARTMENT_ADMIN, Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN)
export class DepartmentAdminController {
  constructor(private readonly service: DepartmentAdminService) {}

  // 1. Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get department administrative dashboard and live metrics' })
  async getDashboard(
    @CurrentUser() actor: AuthUserDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const data = await this.service.getDashboard(actor, startDate, endDate);
    return { message: 'Department dashboard metrics retrieved successfully', data };
  }

  // 2. Department Info
  @Get('info')
  @ApiOperation({ summary: 'Get assigned department details' })
  async getInfo(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getInfo(actor);
    return { message: 'Department details retrieved', data };
  }

  @Patch('info')
  @ApiOperation({ summary: 'Update permitted department operational details' })
  async updateInfo(
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { name?: string; description?: string; workingHours?: string; capacity?: number }
  ) {
    const data = await this.service.updateInfo(actor, dto);
    return { message: 'Department information updated', data };
  }

  // 3. Doctors Management & CRUD
  @Get('doctors')
  @ApiOperation({ summary: 'List department doctors' })
  async getDoctors(
    @CurrentUser() actor: AuthUserDto,
    @Query('search') search?: string,
    @Query('designation') designation?: string,
    @Query('isAvailable') isAvailable?: string
  ) {
    const data = await this.service.getDoctors(
      actor,
      search,
      designation,
      isAvailable !== undefined ? isAvailable === 'true' : undefined
    );
    return { message: 'Department doctors retrieved', data };
  }

  @Post('doctors')
  @ApiOperation({ summary: 'Add doctor to department' })
  async addDoctor(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.addDoctor(actor, dto);
    return { message: 'Doctor added to department successfully', data };
  }

  @Patch('doctors/:id')
  @ApiOperation({ summary: 'Update doctor details in department' })
  async updateDoctor(@Param('id') id: string, @CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.updateDoctor(actor, id, dto);
    return { message: 'Doctor updated successfully', data };
  }

  @Patch('doctors/:id/status')
  @ApiOperation({ summary: 'Toggle doctor availability / active status' })
  async toggleDoctorStatus(@Param('id') id: string, @CurrentUser() actor: AuthUserDto, @Body('status') status?: string) {
    const data = await this.service.toggleDoctorStatus(actor, id, status);
    return { message: 'Doctor status updated', data };
  }

  // 4. Doctor Scheduling
  @Get('doctor-schedules')
  @ApiOperation({ summary: 'Get doctor duty schedules' })
  async getDoctorSchedules(@CurrentUser() actor: AuthUserDto, @Query('doctorId') doctorId?: string) {
    const data = await this.service.getDoctorSchedules(actor, doctorId);
    return { message: 'Doctor duty schedules retrieved', data };
  }

  @Post('doctor-schedules')
  @ApiOperation({ summary: 'Save doctor duty schedules' })
  async saveDoctorSchedule(
    @CurrentUser() actor: AuthUserDto,
    @Body('doctorId') doctorId: string,
    @Body('schedules') schedules: any[]
  ) {
    const data = await this.service.saveDoctorSchedule(actor, doctorId, schedules);
    return { message: 'Doctor schedules saved successfully', data };
  }

  // 5. Staff Management & CRUD
  @Get('staff')
  @ApiOperation({ summary: 'List department staff and nurses' })
  async getStaff(
    @CurrentUser() actor: AuthUserDto,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string
  ) {
    const data = await this.service.getStaff(actor, search, role, status);
    return { message: 'Department staff retrieved', data };
  }

  @Post('staff')
  @ApiOperation({ summary: 'Add staff member to department' })
  async addStaff(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.addStaff(actor, dto);
    return { message: 'Staff member added successfully', data };
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Update staff member details' })
  async updateStaff(@Param('id') id: string, @CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.updateStaff(actor, id, dto);
    return { message: 'Staff member updated successfully', data };
  }

  @Patch('staff/:id/status')
  @ApiOperation({ summary: 'Toggle staff active status' })
  async toggleStaffStatus(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.toggleStaffStatus(actor, id);
    return { message: 'Staff status updated', data };
  }

  // 6. Staff Attendance
  @Get('attendance')
  @ApiOperation({ summary: 'Get department staff attendance' })
  async getAttendance(@CurrentUser() actor: AuthUserDto, @Query('date') date?: string) {
    const data = await this.service.getAttendance(actor, date);
    return { message: 'Staff attendance retrieved', data };
  }

  @Post('attendance')
  @ApiOperation({ summary: 'Record staff attendance' })
  async saveAttendance(@CurrentUser() actor: AuthUserDto, @Body('records') records: any[]) {
    const data = await this.service.saveAttendance(actor, records);
    return { message: 'Attendance saved', data };
  }

  // 7. Patient Management
  @Get('patients')
  @ApiOperation({ summary: 'List patients associated with department' })
  async getPatients(
    @CurrentUser() actor: AuthUserDto,
    @Query('query') query?: string,
    @Query('phone') phone?: string,
    @Query('uhid') uhid?: string
  ) {
    const data = await this.service.getPatients(actor, query, phone, uhid);
    return { message: 'Department patients retrieved', data };
  }

  // 8. Appointments Management & CRUD
  @Get('appointments')
  @ApiOperation({ summary: 'Get department appointments' })
  async getAppointments(
    @CurrentUser() actor: AuthUserDto,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string
  ) {
    const data = await this.service.getAppointments(actor, date, doctorId, status);
    return { message: 'Department appointments retrieved', data };
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Create department appointment' })
  async createAppointment(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.createAppointment(actor, dto);
    return { message: 'Appointment created successfully', data };
  }

  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule department appointment' })
  async rescheduleAppointment(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { appointmentDate: string; appointmentTime: string; doctorId?: string }
  ) {
    const data = await this.service.rescheduleAppointment(actor, id, dto);
    return { message: 'Appointment rescheduled successfully', data };
  }

  @Post('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel department appointment' })
  async cancelAppointment(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('reason') reason: string
  ) {
    const data = await this.service.cancelAppointment(actor, id, reason || 'Cancelled by Department Admin');
    return { message: 'Appointment cancelled', data };
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateAppointmentStatus(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('status') status: string
  ) {
    const data = await this.service.updateAppointmentStatus(actor, id, status);
    return { message: 'Appointment status updated', data };
  }

  // 9. OPD Monitoring
  @Get('opd')
  @ApiOperation({ summary: 'Get department OPD live status and patient flow' })
  async getOpdMonitoring(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getOpdMonitoring(actor);
    return { message: 'OPD monitoring status retrieved', data };
  }

  // 10. IPD Monitoring
  @Get('ipd')
  @ApiOperation({ summary: 'Get department IPD admitted patient census' })
  async getIpdMonitoring(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getIpdMonitoring(actor);
    return { message: 'IPD monitoring data retrieved', data };
  }

  // 11. Wards & Beds Overview
  @Get('wards-beds')
  @ApiOperation({ summary: 'Get department wards and beds overview' })
  async getWardsAndBeds(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getWardsAndBeds(actor);
    return { message: 'Wards and beds overview retrieved', data };
  }

  // 12. Admissions & Discharges
  @Get('admissions')
  @ApiOperation({ summary: 'Monitor department admissions' })
  async getAdmissions(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getIpdMonitoring(actor);
    return { message: 'Admissions list retrieved', data };
  }

  @Get('discharges')
  @ApiOperation({ summary: 'Monitor department discharge candidates' })
  async getDischarges(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getIpdMonitoring(actor);
    return { message: 'Discharge monitoring retrieved', data };
  }

  // 13. Diagnostics Monitoring
  @Get('lab-requests')
  @ApiOperation({ summary: 'Monitor department laboratory requests' })
  async getLabRequests(@CurrentUser() actor: AuthUserDto, @Query('status') status?: string) {
    const data = await this.service.getLabRequests(actor, status);
    return { message: 'Laboratory requests retrieved', data };
  }

  @Get('radiology-requests')
  @ApiOperation({ summary: 'Monitor department radiology and imaging requests' })
  async getRadiologyRequests(@CurrentUser() actor: AuthUserDto, @Query('status') status?: string) {
    const data = await this.service.getRadiologyRequests(actor, status);
    return { message: 'Radiology requests retrieved', data };
  }

  @Get('diagnostics')
  @ApiOperation({ summary: 'Monitor other diagnostic requests' })
  async getDiagnostics(@CurrentUser() actor: AuthUserDto, @Query('status') status?: string) {
    const data = await this.service.getLabRequests(actor, status);
    return { message: 'Diagnostic requests retrieved', data };
  }

  // 14. Equipment & Maintenance
  @Get('equipment')
  @ApiOperation({ summary: 'Get department medical equipment list' })
  async getEquipment(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getEquipment(actor);
    return { message: 'Department equipment retrieved', data };
  }

  @Post('equipment/maintenance')
  @ApiOperation({ summary: 'Submit equipment maintenance request' })
  async submitMaintenanceRequest(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.createRequest(actor, { ...dto, type: 'MAINTENANCE' });
    return { message: 'Maintenance request submitted successfully', data };
  }

  // 15. Inventory & Requests
  @Get('inventory')
  @ApiOperation({ summary: 'Get department inventory and stock levels' })
  async getInventory(
    @CurrentUser() actor: AuthUserDto,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: string
  ) {
    const data = await this.service.getInventory(actor, category, lowStockOnly === 'true');
    return { message: 'Department inventory retrieved', data };
  }

  @Post('inventory/requests')
  @ApiOperation({ summary: 'Submit department stock replenishment request' })
  async submitInventoryRequest(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.createRequest(actor, { ...dto, type: 'SUPPLY' });
    return { message: 'Stock request submitted successfully', data };
  }

  // 16. Leave Management
  @Get('leaves')
  @ApiOperation({ summary: 'Get staff and doctor leave applications' })
  async getLeaves(@CurrentUser() actor: AuthUserDto, @Query('status') status?: string) {
    const data = await this.service.getLeaves(actor, status);
    return { message: 'Leave applications retrieved', data };
  }

  @Post('leaves/:id/review')
  @ApiOperation({ summary: 'Review and submit leave recommendation/approval' })
  async reviewLeave(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('action') action: 'RECOMMEND' | 'APPROVE' | 'REJECT',
    @Body('remarks') remarks?: string
  ) {
    const data = await this.service.reviewLeave(actor, id, action, remarks);
    return { message: 'Leave application reviewed successfully', data };
  }

  // 17. Reports
  @Get('reports')
  @ApiOperation({ summary: 'Generate department-specific reports' })
  async getReports(
    @CurrentUser() actor: AuthUserDto,
    @Query('type') type: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    const data = await this.service.getDashboard(actor, fromDate, toDate);
    return { message: 'Department report generated successfully', data };
  }

  // 18. Requests & Approvals Tracking
  @Get('requests')
  @ApiOperation({ summary: 'Get department requests and approval statuses' })
  async getRequests(@CurrentUser() actor: AuthUserDto, @Query('type') type?: string, @Query('status') status?: string) {
    const data = await this.service.getRequests(actor, type, status);
    return { message: 'Department requests retrieved', data };
  }

  @Post('requests')
  @ApiOperation({ summary: 'Submit new department request' })
  async createRequest(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.createRequest(actor, dto);
    return { message: 'Request submitted successfully', data };
  }

  // 19. Activity Logs
  @Get('activity-logs')
  @ApiOperation({ summary: 'Get department activity audit history' })
  async getActivityLogs(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getActivityLogs(actor);
    return { message: 'Department activity logs retrieved', data };
  }

  // 20. Profile
  @Get('profile')
  @ApiOperation({ summary: 'Get Department Admin profile' })
  async getProfile(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getProfile(actor);
    return { message: 'Profile retrieved', data };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update permitted personal details' })
  async updateProfile(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.updateProfile(actor, dto);
    return { message: 'Profile updated successfully', data };
  }

  @Post('profile/change-password')
  @ApiOperation({ summary: 'Change admin password' })
  async changePassword(@CurrentUser() actor: AuthUserDto, @Body() dto: any) {
    const data = await this.service.changePassword(actor, dto);
    return { message: 'Password updated successfully', data };
  }
}
