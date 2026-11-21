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

    let hospitalId = dto.hospitalId;
    let branchId = dto.branchId;

    if (!hospitalId || !branchId) {
      if (dto.appointmentId) {
        const apt = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
        if (apt) {
          hospitalId = apt.hospitalId;
          branchId = apt.branchId;
        }
      } else if (dto.admissionId) {
        const adm = await this.prisma.admission.findUnique({ where: { id: dto.admissionId } });
        if (adm) {
          hospitalId = adm.hospitalId;
          branchId = adm.branchId;
        }
      }
      if (!hospitalId || !branchId) {
        const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException('Patient not found');
        hospitalId = patient.hospitalId;
        branchId = patient.registrationBranchId;
      }
    }

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
        hospitalId,
        branchId,
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
          hospitalId: invoice.hospitalId,
          branchId: invoice.branchId,
          idempotencyKey: dto.idempotencyKey || `PAY-${invoiceId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          requestFingerprint: dto.requestFingerprint || `FP-${invoiceId}-${cashierUserId}-${Date.now()}`,
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
