import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';
import { resolveOperationalScope } from '../common/utils/operational-scope';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports & Analytics')
@Controller('reports')
@Scoped()
@UseGuards(RolesGuard)
@RequirePermissions('REPORTS:VIEW')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get unified hospital executive dashboard metrics' })
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  async getDashboardStats(@CurrentUser() actor: AuthUserDto, @Query('branchId') requestedBranchId?: string) {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const data = await this.service.getDashboardStats(scope.hospitalId, scope.branchId);
    return {
      message: 'Dashboard statistics retrieved',
      data,
    };
  }

  @Get('super-admin-dashboard')
  @Roles(Role.SUPER_ADMIN)
  async getSuperAdminDashboard(@CurrentUser() actor: AuthUserDto) {
    return { message: 'Dashboard statistics retrieved.', data: await this.service.getSuperAdminDashboard(actor.hospitalId) };
  }

  @Get('hospital-admin-dashboard')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get comprehensive executive hospital dashboard statistics with live database data' })
  async getHospitalAdminDashboard(
    @CurrentUser() actor: AuthUserDto,
    @Query('branchId') requestedBranchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const data = await this.service.getHospitalAdminDashboard(scope.hospitalId, scope.branchId, startDate, endDate);
    return {
      message: 'Executive hospital dashboard statistics retrieved successfully',
      data,
    };
  }

  @Get('export')
  @RequirePermissions('REPORTS:EXPORT')
  @ApiOperation({ summary: 'Generate and export hospital operational and financial report data' })
  async getHospitalReport(
    @CurrentUser() actor: AuthUserDto,
    @Query('type') type: string,
    @Query('branchId') requestedBranchId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const data = await this.service.getHospitalReport(
      scope.hospitalId,
      type || 'OPD',
      scope.branchId,
      departmentId,
      fromDate,
      toDate
    );
    return {
      message: `${type || 'Operational'} report generated successfully`,
      data,
    };
  }
}
