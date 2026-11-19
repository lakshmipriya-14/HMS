import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRadiologyOrderDto, UploadRadiologyReportDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Radiology & Imaging')
@Controller('radiology')
export class RadiologyController {
  constructor(private service: RadiologyService) {}

  @Get('tests')
  @ApiOperation({ summary: 'Get radiology and imaging scan catalogue' })
  async getCatalogue() {
    const data = await this.service.getCatalogue();
    return {
      message: 'Radiology test catalogue retrieved',
      data,
    };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Order imaging study (X-Ray, CT, MRI, USG)' })
  async createOrder(@Body() dto: CreateRadiologyOrderDto) {
    const data = await this.service.createOrder(dto);
    return {
      message: 'Radiology order scheduled',
      data,
    };
  }

  @Get('worklist')
  @ApiOperation({ summary: 'Get radiology worklist' })
  async getWorklist() {
    const data = await this.service.getWorklist();
    return {
      message: 'Radiology worklist retrieved',
      data,
    };
  }

  @Post('orders/:id/report')
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
