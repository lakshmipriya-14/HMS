import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectPaymentDto, CreateInvoiceDto } from '@multispeciality-hms/contracts';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async getInvoices(patientId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        items: true,
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
        payments: true,
        claims: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const invoiceNumber = await this.generateInvoiceNumber();

    const items = dto.items.map((i) => {
      const discount = i.discountPercentage ? (i.unitPrice * i.quantity * i.discountPercentage) / 100 : 0;
      const total = i.unitPrice * i.quantity - discount;
      return {
        description: i.description,
        category: i.category,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPercentage: i.discountPercentage || 0,
        totalPrice: total,
      };
    });

    const subTotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const taxAmount = dto.taxPercentage ? (subTotal * dto.taxPercentage) / 100 : 0;
    const discountAmount = dto.discountAmount || 0;
    const totalAmount = Math.max(0, subTotal + taxAmount - discountAmount);

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        admissionId: dto.admissionId,
        appointmentId: dto.appointmentId,
        subTotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount: 0,
        status: 'PENDING',
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: { items: true, patient: true },
    });
  }

  async collectPayment(invoiceId: string, dto: CollectPaymentDto, cashierUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const currentPaid = Number(invoice.paidAmount);
      const total = Number(invoice.totalAmount);
      const newPaid = currentPaid + dto.amount;

      let status = 'PARTIALLY_PAID';
      if (newPaid >= total) {
        status = 'PAID';
      }

      // Record payment transaction
      await tx.payment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference,
          receivedByUserId: cashierUserId,
          notes: dto.notes,
        },
      });

      // Update invoice paidAmount and status
      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          status,
        },
        include: { payments: true, items: true },
      });
    });
  }

  async getInsuranceClaims() {
    return this.prisma.insuranceClaim.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        invoice: { select: { invoiceNumber: true, totalAmount: true } },
      },
    });
  }
}
