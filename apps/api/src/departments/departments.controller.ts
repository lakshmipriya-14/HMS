import { Controller, Get, Param } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
@Scoped()
@RequirePermissions('DEPARTMENTS:VIEW')
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospital clinical departments' })
  async findAll(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findAll(actor);
    return {
      message: 'Departments retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department details and doctors' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.findOne(actor, id);
    return {
      message: 'Department details retrieved',
      data,
    };
  }
}
