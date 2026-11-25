import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('User Management')
@Controller('users')
@UseGuards(RolesGuard)
@Scoped()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN)
  @RequirePermissions('USERS:VIEW')
  @ApiOperation({ summary: 'List system users with filters' })
  async findAll(
    @CurrentUser() actor: AuthUserDto,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.findAll(actor, role, search, branchId);
    return {
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:CREATE')
  @ApiOperation({ summary: 'Create new hospital employee/staff user' })
  async createStaff(
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: Role;
      branchId?: string;
      departmentId?: string;
      employeeCode?: string;
      designation?: string;
    }
  ) {
    const data = await this.service.createStaff(actor, dto);
    return {
      message: 'Staff user created successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:VIEW')
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const data = await this.service.findOne(actor, id);
    return {
      message: 'User details retrieved',
      data,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:UPDATE')
  @ApiOperation({ summary: 'Update user profile and employee designation' })
  async updateUser(
    @CurrentUser() actor: AuthUserDto,
    @Param('id') id: string,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; designation?: string; departmentId?: string }
  ) {
    const data = await this.service.updateUser(actor, id, dto);
    return {
      message: 'User updated successfully',
      data,
    };
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:UPDATE')
  @ApiOperation({ summary: 'Toggle user active/inactive account status' })
  async toggleStatus(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const data = await this.service.toggleStatus(actor, id);
    return {
      message: 'User status updated',
      data,
    };
  }

  @Post('bulk-status')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:UPDATE')
  @ApiOperation({ summary: 'Bulk activate or deactivate staff accounts' })
  async bulkStatus(
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { userIds: string[]; isActive: boolean }
  ) {
    const data = await this.service.bulkToggleStatus(actor, dto.userIds, dto.isActive);
    return {
      message: `Successfully updated ${data.updatedCount} accounts to ${data.isActive ? 'Active' : 'Inactive'}`,
      data,
    };
  }

  @Post(':id/reset-password')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('USERS:UPDATE')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(
    @CurrentUser() actor: AuthUserDto,
    @Param('id') id: string,
    @Body('password') password?: string
  ) {
    const data = await this.service.resetPassword(actor, id, password);
    return {
      message: 'Password reset successfully',
      data,
    };
  }
}
