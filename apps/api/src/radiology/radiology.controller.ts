import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUserDto, CreateRadiologyOrderDto, UploadRadiologyReportDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Radiology & Imaging')
@Controller('radiology')
@Scoped()
@UseGuards(RolesGuard)
export class RadiologyController {
  constructor(private service: RadiologyService) {}

  @Get('tests')
  @RequirePermissions('RADIOLOGY_ORDERS:VIEW')
  @ApiOperation({ summary: 'Get radiology and imaging scan catalogue' })
  async getCatalogue() {
    const data = await this.service.getCatalogue();
    return {
      message: 'Radiology test catalogue retrieved',
      data,
    };
  }

  @Post('orders')
  @RequirePermissions('RADIOLOGY_ORDERS:CREATE')
  @ApiOperation({ summary: 'Order imaging study (X-Ray, CT, MRI, USG)' })
  async createOrder(@Body() dto: CreateRadiologyOrderDto, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.createOrder(dto, actor);
    return {
      message: 'Radiology order scheduled',
      data,
    };
  }

  @Get('worklist')
  @RequirePermissions('RADIOLOGY_ORDERS:VIEW')
  @ApiOperation({ summary: 'Get radiology worklist' })
  async getWorklist(@CurrentUser() actor: AuthUserDto) {
    const data = await this.service.getWorklist(actor);
    return {
      message: 'Radiology worklist retrieved',
      data,
    };
  }

  @Post('orders/:id/report')
  @RequirePermissions('RADIOLOGY_REPORTS:RELEASE')
  @ApiOperation({ summary: 'Upload radiology impression findings and release scan report' })
  async uploadReport(
    @Param('id') id: string,
    @Body() dto: UploadRadiologyReportDto,
    @CurrentUser('id') userId: string
  ) {
    dto.orderId = id;
    const data = await this.service.uploadReport(id, dto, userId);
    return {
      message: 'Radiology report released',
      data,
    };
  }
}
