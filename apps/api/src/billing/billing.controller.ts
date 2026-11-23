import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CollectPaymentDto, CreateInvoiceDto, AdvancePaymentDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Billing, Invoicing & Insurance')
@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices with optional patient filter' })
  async getInvoices(
    @CurrentUser() actor?: AuthUserDto,
    @Query('patientId') patientId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getInvoices(actor, patientId, branchId);
    return {
      message: 'Invoices retrieved successfully',
      data,
    };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details with items and payment history' })
  async findOne(@Param('id') id: string, @CurrentUser() actor?: AuthUserDto) {
    const data = await this.service.findOne(id, actor);
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
    @CurrentUser('id') cashierUserId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.collectPayment(id, dto, cashierUserId, actor);
    return {
      message: 'Payment collected and recorded on invoice',
      data,
    };
  }

  @Get('insurance-claims')
  @ApiOperation({ summary: 'List active insurance claims and TPA statuses' })
  async getInsuranceClaims(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getInsuranceClaims(actor, branchId);
    return {
      message: 'Insurance claims retrieved',
      data,
    };
  }

  @Post('ipd-charges')
  @ApiOperation({ summary: 'Calculate or generate IPD room rent & nursing charges' })
  async calculateIPDCharges(
    @Body('admissionId') admissionId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.calculateIPDCharges(admissionId, actor);
    return {
      message: 'IPD charges calculated successfully',
      data,
    };
  }

  @Post('advance-payments')
  @ApiOperation({ summary: 'Record advance deposit payment for IPD admission' })
  async recordAdvancePayment(
    @Body() dto: AdvancePaymentDto,
    @CurrentUser('id') cashierUserId: string,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.recordAdvancePayment(dto, cashierUserId, actor);
    return {
      message: 'Advance payment recorded successfully',
      data,
    };
  }
}
