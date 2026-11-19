import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('User Management')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'List system users with filters' })
  async findAll(@Query('role') role?: string, @Query('search') search?: string) {
    const data = await this.service.findAll(role, search);
    return {
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'User details retrieved',
      data,
    };
  }
}
