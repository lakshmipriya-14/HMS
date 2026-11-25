import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DispensePrescriptionDto, AdjustStockDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pharmacy & Inventory')
@Controller('pharmacy')
@Scoped()
@UseGuards(RolesGuard)
export class PharmacyController {
  constructor(private service: PharmacyService) {}

  @Get('prescriptions')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get active prescription dispensing queue (alias)' })
  async getPrescriptions(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getDispenseQueue(actor, branchId);
    return {
      message: 'Prescriptions awaiting dispensing retrieved',
      data,
    };
  }

  @Post('dispense')
  @RequirePermissions('PHARMACY_DISPENSE:DISPENSE')
  @ApiOperation({ summary: 'Dispense prescription medications (direct endpoint)' })
  async dispenseDirect(
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser('id') pharmacistId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const id = dto.prescriptionId;
    const data = await this.service.dispense(id, dto, pharmacistId || 'pharmacist-default', actor);
    return {
      message: 'Medications dispensed and inventory updated successfully',
      data,
    };
  }

  @Post('inventory/adjust')
  @RequirePermissions('PHARMACY_INVENTORY:UPDATE')
  @ApiOperation({ summary: 'Adjust stock inventory' })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.adjustStock(dto, userId, actor);
    return {
      message: 'Inventory adjusted successfully',
      data,
    };
  }

  @Get('medicines')
  @RequirePermissions('PHARMACY_INVENTORY:VIEW')
  @ApiOperation({ summary: 'Search medicine formulary catalogue and stock' })
  async getMedicines(
    @CurrentUser() actor?: AuthUserDto,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getMedicines(actor, search, branchId);
    return {
      message: 'Medicines retrieved',
      data,
    };
  }

  @Get('dispense-queue')
  @RequirePermissions('PRESCRIPTIONS:VIEW')
  @ApiOperation({ summary: 'Get active prescription dispensing queue' })
  async getDispenseQueue(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getDispenseQueue(actor, branchId);
    return {
      message: 'Prescriptions awaiting dispensing retrieved',
      data,
    };
  }

  @Post('prescriptions/:id/dispense')
  @RequirePermissions('PHARMACY_DISPENSE:DISPENSE')
  @ApiOperation({ summary: 'Dispense prescription medications and deduct stock' })
  async dispense(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser('id') pharmacistId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    dto.prescriptionId = id;
    const data = await this.service.dispense(id, dto, pharmacistId, actor);
    return {
      message: 'Medications dispensed and inventory updated successfully',
      data,
    };
  }

  @Get('low-stock')
  @RequirePermissions('PHARMACY_INVENTORY:VIEW')
  @ApiOperation({ summary: 'Get low stock inventory warnings' })
  async getLowStock(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getLowStockAlerts(actor, branchId);
    return {
      message: 'Low stock alerts retrieved',
      data,
    };
  }

  @Get('expiry-alerts')
  @RequirePermissions('PHARMACY_INVENTORY:VIEW')
  @ApiOperation({ summary: 'Get near-expiry batch warnings' })
  async getExpiryAlerts(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getExpiryAlerts(actor, branchId);
    return {
      message: 'Expiry alerts retrieved',
      data,
    };
  }

  @Post('medicines')
  @RequirePermissions('PHARMACY_INVENTORY:CREATE')
  @ApiOperation({ summary: 'Add a new medicine to catalogue formulary' })
  async createMedicine(
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      code?: string;
      brandName: string;
      genericName: string;
      category: string;
      strength: string;
      dosageForm: string;
      manufacturer: string;
      unitPrice: number;
      reorderLevel?: number;
      initialStock?: number;
      batchNumber?: string;
      expiryDate?: string;
      branchId?: string;
    }
  ) {
    const data = await this.service.createMedicine(actor, dto);
    return {
      message: 'Medicine added to formulary catalogue successfully',
      data,
    };
  }

  @Patch('medicines/:id')
  @RequirePermissions('PHARMACY_INVENTORY:UPDATE')
  @ApiOperation({ summary: 'Update medicine formulary details' })
  async updateMedicine(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      brandName?: string;
      genericName?: string;
      category?: string;
      strength?: string;
      dosageForm?: string;
      manufacturer?: string;
      unitPrice?: number;
      reorderLevel?: number;
    }
  ) {
    const data = await this.service.updateMedicine(actor, id, dto);
    return {
      message: 'Medicine details updated successfully',
      data,
    };
  }

  @Patch('medicines/:id/status')
  @RequirePermissions('PHARMACY_INVENTORY:UPDATE')
  @ApiOperation({ summary: 'Toggle medicine active status' })
  async toggleMedicineStatus(@Param('id') id: string, @CurrentUser() actor: AuthUserDto) {
    const data = await this.service.toggleMedicineStatus(actor, id);
    return {
      message: 'Medicine status updated',
      data,
    };
  }

  @Post('medicines/:id/batches')
  @RequirePermissions('PHARMACY_INVENTORY:CREATE')
  @ApiOperation({ summary: 'Receive new stock batch for a medicine' })
  async addBatch(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUserDto,
    @Body()
    dto: {
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      costPrice?: number;
      sellingPrice?: number;
      branchId?: string;
    }
  ) {
    const data = await this.service.addBatch(actor, id, dto);
    return {
      message: 'Stock batch added successfully',
      data,
    };
  }

  @Get('inventory/movements')
  @RequirePermissions('PHARMACY_INVENTORY:VIEW')
  @ApiOperation({ summary: 'Get stock audit ledger movements' })
  async getMovements(
    @CurrentUser() actor: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getInventoryMovements(actor, branchId);
    return {
      message: 'Inventory movements retrieved',
      data,
    };
  }
}
