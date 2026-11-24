import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SuperAdminService, ListQuery } from './super-admin.service';
import { SuperAdminReadService, ReportQuery } from './super-admin-read.service';
import { AdministratorInput, BranchAssignmentInput, BranchEdit, BranchInput, DepartmentInput, EmployeeEdit, MasterItemInput, OrganizationInput, StatusInput } from './super-admin.dto';

@Scoped()
@Roles(Role.SUPER_ADMIN)
@UseGuards(RolesGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService, private readonly read: SuperAdminReadService) {}

  @Get('organization')
  @RequirePermissions('HOSPITALS:VIEW')
  async organization(@CurrentUser() actor: AuthUserDto) {
    const result = await this.service.organization(actor);
    return { message: 'Request completed.', data: result };
  }

  @Patch('organization')
  @RequirePermissions('HOSPITALS:UPDATE')
  async updateOrganization(@CurrentUser() actor: AuthUserDto, @Body() input: OrganizationInput) {
    const result = await this.service.updateOrganization(actor, input);
    return { message: 'Request completed.', data: result };
  }

  @Get('branches')
  @RequirePermissions('HOSPITALS:VIEW')
  async branches(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.service.branches(actor, query);
    return { message: 'Records retrieved.', ...result };
  }

  @Get('branches/:id')
  @RequirePermissions('HOSPITALS:VIEW')
  async branch(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const result = await this.service.branch(actor, id);
    return { message: 'Request completed.', data: result };
  }

  @Post('branches')
  @RequirePermissions('HOSPITALS:CREATE')
  async createBranch(@CurrentUser() actor: AuthUserDto, @Body() input: BranchInput) {
    const result = await this.service.createBranch(actor, input);
    return { message: 'Request completed.', data: result };
  }

  @Patch('branches/:id')
  @RequirePermissions('HOSPITALS:UPDATE')
  async editBranch(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: BranchEdit) {
    const result = await this.service.editBranch(actor, id, input);
    return { message: 'Request completed.', data: result };
  }

  @Patch('branches/:id/status')
  @RequirePermissions('HOSPITALS:UPDATE')
  async branchStatus(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: StatusInput) {
    const result = await this.service.editBranch(actor, id, input);
    return { message: 'Request completed.', data: result };
  }

  @Delete('branches/:id')
  @RequirePermissions('HOSPITALS:DELETE')
  async deleteBranch(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const result = await this.service.deleteBranch(actor, id);
    return { message: 'Branch deleted.', data: result };
  }

  @Get('departments')
  @RequirePermissions('DEPARTMENTS:VIEW')
  async departments(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.service.departments(actor, query);
    return { message: 'Records retrieved.', ...result };
  }

  @Post('departments')
  @RequirePermissions('DEPARTMENTS:CREATE')
  async createDepartment(@CurrentUser() actor: AuthUserDto, @Body() input: DepartmentInput) {
    const result = await this.service.saveDepartment(actor, input);
    return { message: 'Request completed.', data: result };
  }

  @Patch('departments/:id')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  async editDepartment(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: DepartmentInput) {
    const result = await this.service.saveDepartment(actor, input, id);
    return { message: 'Request completed.', data: result };
  }

  @Patch('departments/:id/status')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  async departmentStatus(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: StatusInput) {
    const result = await this.service.saveDepartment(actor, input, id);
    return { message: 'Request completed.', data: result };
  }

  @Get('admins')
  @RequirePermissions('USERS:VIEW')
  async admins(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.service.directory(actor, query, true);
    return { message: 'Records retrieved.', ...result };
  }

  @Get('users')
  @RequirePermissions('USERS:VIEW')
  async users(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.service.directory(actor, query);
    return { message: 'Records retrieved.', ...result };
  }

  @Get('users/:id')
  @RequirePermissions('USERS:VIEW')
  async account(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const result = await this.service.account(actor, id);
    return { message: 'Request completed.', data: result };
  }

  @Post('admins')
  @RequirePermissions('USERS:CREATE')
  @Header('Cache-Control', 'no-store')
  async createAdmin(@CurrentUser() actor: AuthUserDto, @Body() input: AdministratorInput) {
    const result = await this.service.createAdministrator(actor, input);
    return { message: 'Request completed.', data: result };
  }

  @Patch('users/:id/status')
  @RequirePermissions('USERS:UPDATE')
  async accountStatus(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: StatusInput) {
    const result = await this.service.accountStatus(actor, id, input.isActive);
    return { message: 'Request completed.', data: result };
  }

  @Patch('users/:id/branch-assignment')
  @RequirePermissions('ROLES:ASSIGN')
  async assignBranch(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: BranchAssignmentInput) {
    const result = await this.service.assignBranch(actor, id, input.branchId);
    return { message: 'Request completed.', data: result };
  }

  @Patch('users/:id/employee')
  @RequirePermissions('USERS:UPDATE')
  async editEmployee(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: EmployeeEdit) {
    const result = await this.service.updateEmployee(actor, id, input);
    return { message: 'Request completed.', data: result };
  }

  @Post('users/:id/invitation-code')
  @RequirePermissions('USERS:UPDATE')
  @Header('Cache-Control', 'no-store')
  async invite(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const result = await this.service.accountAccess(actor, id, 'INVITATION');
    return { message: 'Request completed.', data: result };
  }

  @Post('users/:id/reset-code')
  @RequirePermissions('USERS:UPDATE')
  @Header('Cache-Control', 'no-store')
  async reset(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const result = await this.service.accountAccess(actor, id, 'RESET');
    return { message: 'Request completed.', data: result };
  }

  @Get('policies/:name')
  @RequirePermissions('ROLES:VIEW')
  async policy(@CurrentUser() actor: AuthUserDto, @Param('name') name: string) {
    const result = await this.service.rolePolicy(actor, name);
    return { message: 'Request completed.', data: result };
  }

  @Patch('policies/:name')
  @RequirePermissions('ROLES:UPDATE')
  async updatePolicy(@CurrentUser() actor: AuthUserDto, @Param('name') name: string, @Body('grants') grants: unknown) {
    const result = await this.service.savePolicy(actor, name, grants);
    return { message: 'Request completed.', data: result };
  }

  @Get('master-items')
  @RequirePermissions('HOSPITALS:VIEW')
  async items(@CurrentUser() actor: AuthUserDto) {
    const result = await this.service.masterItems(actor);
    return { message: 'Request completed.', data: result };
  }

  @Post('master-items')
  @RequirePermissions('HOSPITALS:UPDATE')
  async addItem(@CurrentUser() actor: AuthUserDto, @Body() input: MasterItemInput) {
    const result = await this.service.addMasterItem(actor, input);
    return { message: 'Request completed.', data: result };
  }

  @Patch('master-items/:id')
  @RequirePermissions('HOSPITALS:UPDATE')
  async editItem(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: MasterItemInput) {
    return { message: 'Master data updated.', data: await this.service.editMasterItem(actor, id, input) };
  }

  @Patch('master-items/:id/status')
  @RequirePermissions('HOSPITALS:UPDATE')
  async itemStatus(@CurrentUser() actor: AuthUserDto, @Param('id') id: string, @Body() input: StatusInput) {
    const result = await this.service.setMasterStatus(actor, id, input.isActive);
    return { message: 'Request completed.', data: result };
  }

  @Get('doctors')
  @RequirePermissions('DOCTORS:VIEW')
  @Header('Cache-Control', 'no-store')
  async doctors(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.read.doctors(actor, query);
    return { message: 'Records retrieved.', ...result };
  }

  @Get('patients')
  @RequirePermissions('PATIENTS:VIEW')
  @Header('Cache-Control', 'no-store')
  async patients(@CurrentUser() actor: AuthUserDto, @Query() query: ListQuery) {
    const result = await this.read.patients(actor, query);
    return { message: 'Records retrieved.', ...result };
  }

  @Get('reports/:key')
  @RequirePermissions('REPORTS:VIEW')
  @Header('Cache-Control', 'no-store')
  async report(@CurrentUser() actor: AuthUserDto, @Param('key') key: string, @Query() query: ReportQuery) {
    const result = await this.read.report(actor, key, query);
    return { message: 'Request completed.', data: result };
  }

  @Post('reports/:key/export')
  @RequirePermissions('REPORTS:EXPORT')
  @Header('Cache-Control', 'no-store')
  async exportReport(@CurrentUser() actor: AuthUserDto, @Param('key') key: string, @Query() query: ReportQuery) {
    const result = await this.read.exportReport(actor, key, query);
    return { message: 'Request completed.', data: result };
  }
}
