import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CollectPaymentDto, CreateInvoiceDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Billing, Invoicing & Insurance')
@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices with optional patient filter' })
  async getInvoices(@Query('patientId') patientId?: string) {
    const data = await this.service.getInvoices(patientId);
    return {
      message: 'Invoices retrieved successfully',
      data,
    };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details with items and payment history' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Invoice details retrieved',
      data,
    };
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Generate hospital billing invoice' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    const data = await this.service.createInvoice(dto);
    return {
      message: 'Hospital invoice generated',
      data,
    };
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Collect cash, UPI, card, or insurance payment' })
  async collectPayment(
    @Param('id') id: string,
    @Body() dto: CollectPaymentDto,
    @CurrentUser('id') cashierUserId: string
  ) {
    const data = await this.service.collectPayment(id, dto, cashierUserId);
    return {
      message: 'Payment collected and recorded on invoice',
      data,
    };
  }

  @Get('insurance-claims')
  @ApiOperation({ summary: 'List active insurance claims and TPA statuses' })
  async getInsuranceClaims() {
    const data = await this.service.getInsuranceClaims();
    return {
      message: 'Insurance claims retrieved',
      data,
    };
  }
}
