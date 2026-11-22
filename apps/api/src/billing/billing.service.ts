import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectPaymentDto, CreateInvoiceDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async getInvoices(actor?: AuthUserDto, patientId?: string, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }
    if (patientId) where.patientId = patientId;

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        items: true,
        payments: true,
      },
    });
  }

  async findOne(id: string, actor?: AuthUserDto) {
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
    if (actor) {
      assertBranchAccess(actor, invoice.branchId);
    }
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

  async collectPayment(invoiceId: string, dto: CollectPaymentDto, cashierUserId: string, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      if (actor) {
        assertBranchAccess(actor, invoice.branchId);
      }

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

  async getInsuranceClaims(actor?: AuthUserDto, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      if (scope.branchId) {
        where.invoice = { branchId: scope.branchId };
      }
    } else if (branchId) {
      where.invoice = { branchId };
    }

    return this.prisma.insuranceClaim.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        invoice: { select: { invoiceNumber: true, totalAmount: true } },
      },
    });
  }
}
