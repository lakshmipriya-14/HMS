import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DispensePrescriptionDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pharmacy & Inventory')
@Controller('pharmacy')
export class PharmacyController {
  constructor(private service: PharmacyService) {}

  @Get('medicines')
  @ApiOperation({ summary: 'Search medicine formulary catalogue and stock' })
  async getMedicines(@Query('search') search?: string) {
    const data = await this.service.getMedicines(search);
    return {
      message: 'Medicines retrieved',
      data,
    };
  }

  @Get('dispense-queue')
  @ApiOperation({ summary: 'Get active prescription dispensing queue' })
  async getDispenseQueue() {
    const data = await this.service.getDispenseQueue();
    return {
      message: 'Prescriptions awaiting dispensing retrieved',
      data,
    };
  }

  @Post('prescriptions/:id/dispense')
  @ApiOperation({ summary: 'Dispense prescription medications and deduct stock' })
  async dispense(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser('id') pharmacistId: string
  ) {
    dto.prescriptionId = id;
    const data = await this.service.dispense(id, dto, pharmacistId);
    return {
      message: 'Medications dispensed and inventory updated successfully',
      data,
    };
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock inventory warnings' })
  async getLowStock() {
    const data = await this.service.getLowStockAlerts();
    return {
      message: 'Low stock alerts retrieved',
      data,
    };
  }

  @Get('expiry-alerts')
  @ApiOperation({ summary: 'Get near-expiry batch warnings' })
  async getExpiryAlerts() {
    const data = await this.service.getExpiryAlerts();
    return {
      message: 'Expiry alerts retrieved',
      data,
    };
  }
}
