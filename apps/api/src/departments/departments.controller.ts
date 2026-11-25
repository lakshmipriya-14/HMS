import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
@Scoped()
@UseGuards(RolesGuard)
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get()
  @RequirePermissions('DEPARTMENTS:VIEW')
  @ApiOperation({ summary: 'List all hospital clinical departments' })
  async findAll(@CurrentUser() actor: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.findAll(actor, branchId);
    return {
      message: 'Departments retrieved successfully',
      data,
    };
  }

  @Post()
  @RequirePermissions('DEPARTMENTS:CREATE')
  @ApiOperation({ summary: 'Create new hospital department' })
  async create(
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { name: string; code: string; description?: string; branchId?: string; headOfDepartmentId?: string }
  ) {
    const data = await this.service.create(actor, dto);
    return {
      message: 'Department created successfully',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('DEPARTMENTS:VIEW')
  @ApiOperation({ summary: 'Get department details and doctors' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findOne(actor, id);
    return {
      message: 'Department details retrieved',
      data,
    };
  }

  @Patch(':id')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  @ApiOperation({ summary: 'Update department information' })
  async update(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body() dto: { name?: string; description?: string; headOfDepartmentId?: string }
  ) {
    const data = await this.service.update(actor, id, dto);
    return {
      message: 'Department updated successfully',
      data,
    };
  }

  @Patch(':id/status')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  @ApiOperation({ summary: 'Toggle department active status' })
  async toggleStatus(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.toggleStatus(actor, id);
    return {
      message: 'Department status updated',
      data,
    };
  }

  @Post(':id/hod')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  @ApiOperation({ summary: 'Assign doctor as Head of Department (HOD)' })
  async assignHod(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('doctorId') doctorId: string | null
  ) {
    const data = await this.service.assignHod(actor, id, doctorId);
    return {
      message: 'Head of Department updated successfully',
      data,
    };
  }

  @Post(':id/admin')
  @RequirePermissions('DEPARTMENTS:UPDATE')
  @ApiOperation({ summary: 'Assign or replace Department Admin (1 active admin per department enforced)' })
  async assignDepartmentAdmin(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body('userId') userId: string
  ) {
    const data = await this.service.assignDepartmentAdmin(actor, id, userId);
    return {
      message: 'Department Administrator assigned successfully',
      data,
    };
  }

  @Get(':id/stats')
  @RequirePermissions('DEPARTMENTS:VIEW')
  @ApiOperation({ summary: 'Get department capacity and resource statistics' })
  async getDepartmentStats(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getDepartmentStats(actor, id);
    return {
      message: 'Department statistics retrieved',
      data,
    };
  }
}
