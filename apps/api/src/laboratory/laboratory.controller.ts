import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLabOrderDto, EnterLabResultsDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Laboratory & Diagnostics')
@Controller('laboratory')
@Scoped()
@UseGuards(RolesGuard)
export class LaboratoryController {
  constructor(private service: LaboratoryService) {}

  @Get('tests')
  @RequirePermissions('LAB_ORDERS:VIEW')
  @ApiOperation({ summary: 'Get active laboratory test catalogue' })
  async getCatalogue() {
    const data = await this.service.getCatalogue();
    return {
      message: 'Laboratory test catalogue retrieved',
      data,
    };
  }

  @Post('orders')
  @RequirePermissions('LAB_ORDERS:CREATE')
  @ApiOperation({ summary: 'Create doctor laboratory order' })
  async createOrder(@Body() dto: CreateLabOrderDto, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.createOrder(dto, actor);
    return {
      message: 'Laboratory order submitted successfully',
      data,
    };
  }

  @Get('worklist')
  @RequirePermissions('LAB_ORDERS:VIEW')
  @ApiOperation({ summary: 'Get pending orders and sample processing worklist' })
  async getWorklist(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getWorklist(actor, branchId);
    return {
      message: 'Laboratory worklist retrieved',
      data,
    };
  }

  @Post('orders/:id/collect-sample')
  @RequirePermissions('LAB_ORDERS:UPDATE')
  @ApiOperation({ summary: 'Record sample collection and barcode' })
  async collectSample(
    @Param('id') id: string,
    @Body('barcode') barcode?: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.collectSample(id, barcode, actor);
    return {
      message: 'Sample collected and marked in lab queue',
      data,
    };
  }

  @Post('orders/:id/results')
  @RequirePermissions('LAB_RESULTS:CREATE')
  @ApiOperation({ summary: 'Enter test parameter values and flag critical values' })
  async enterResults(
    @Param('id') id: string,
    @Body() dto: EnterLabResultsDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    dto.orderId = id;
    const data = await this.service.enterResults(dto, actor);
    return {
      message: 'Test results saved successfully',
      data,
    };
  }

  @Post('orders/:id/release')
  @RequirePermissions('LAB_RESULTS:RELEASE')
  @ApiOperation({ summary: 'Release validated laboratory report for doctors and patients' })
  async releaseReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.releaseReport(id, userId, actor);
    return {
      message: 'Laboratory diagnostic report verified and released',
      data,
    };
  }
}
