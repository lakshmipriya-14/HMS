import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Executive Approvals Hub')
@Controller('approvals')
@Scoped()
@UseGuards(RolesGuard)
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get('pending')
  @RequirePermissions('APPOINTMENTS:VIEW', 'WARDS:VIEW')
  @ApiOperation({ summary: 'Get all pending approval requests for the hospital branch' })
  async getPending(@CurrentUser() actor: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.getPendingApprovals(actor, branchId);
    return {
      message: 'Pending approvals retrieved successfully',
      data,
    };
  }

  @Post(':type/:id/action')
  @RequirePermissions('WARDS:UPDATE', 'APPOINTMENTS:VIEW')
  @ApiOperation({ summary: 'Approve or reject a request' })
  async processAction(
    @Param('type') type: 'appointment-request' | 'doctor-leave' | 'bed-turnover',
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('notes') notes?: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const result = await this.service.processAction(actor!, type, id, action, notes);
    return result;
  }

  @Get('history')
  @RequirePermissions('APPOINTMENTS:VIEW', 'WARDS:VIEW')
  @ApiOperation({ summary: 'Get approval history and audit trail' })
  async getHistory(@CurrentUser() actor: AuthUserDto, @Query('branchId') branchId?: string) {
    const data = await this.service.getApprovalHistory(actor, branchId);
    return {
      message: 'Approval history retrieved successfully',
      data,
    };
  }
}
