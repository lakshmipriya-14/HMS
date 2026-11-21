import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions, Roles, Scoped } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@Controller('audit')
@UseGuards(RolesGuard)
@Scoped()
export class AuditController {
  constructor(private service: AuditService) { }

  @Get('logs')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @RequirePermissions('AUDIT_LOGS:VIEW')
  @ApiOperation({ summary: 'View immutable hospital audit trail' })
  async getLogs(
    @CurrentUser() actor: AuthUserDto,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const data = await this.service.getLogs(
      actor,
      action,
      resource,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25,
      sortOrder === 'asc' ? 'asc' : 'desc'
    );
    return {
      message: 'Audit logs retrieved',
      data: data.items,
      meta: data.meta,
    };
  }
}
