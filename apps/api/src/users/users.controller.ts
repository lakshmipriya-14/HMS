import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
@RequirePermissions('USERS:VIEW')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN)
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

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@CurrentUser() actor: AuthUserDto, @Param('id') id: string) {
    const data = await this.service.findOne(actor, id);
    return {
      message: 'User details retrieved',
      data,
    };
  }
}
