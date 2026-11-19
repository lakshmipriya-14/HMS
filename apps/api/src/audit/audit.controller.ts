import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private service: AuditService) {}

  @Get('logs')
  @Roles(Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'View immutable hospital audit trail' })
  async getLogs(
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const data = await this.service.getLogs(
      action,
      resource,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25
    );
    return {
      message: 'Audit logs retrieved',
      data: data.items,
      meta: data.meta,
    };
  }
}
