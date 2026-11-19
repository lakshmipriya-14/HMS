import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports & Analytics')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get unified hospital executive dashboard metrics' })
  async getDashboardStats() {
    const data = await this.service.getDashboardStats();
    return {
      message: 'Dashboard statistics retrieved',
      data,
    };
  }
}
