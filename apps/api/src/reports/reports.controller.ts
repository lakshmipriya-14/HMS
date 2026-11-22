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
}
