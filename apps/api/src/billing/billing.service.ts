import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectPaymentDto, CreateInvoiceDto, AdvancePaymentDto, AuthUserDto, Role } from '@multispeciality-hms/contracts';
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
    if (actor?.role === Role.PATIENT) {
      if (!actor.patientProfileId || (patientId && actor.patientProfileId !== patientId)) return [];
      where.patientId = actor.patientProfileId;
      where.patient = { userId: actor.id, deletedAt: null };
    } else if (patientId) where.patientId = patientId;

    const doctor = { select: { employee: { select: { user: { select: { firstName: true, lastName: true } } } },
      department: { select: { name: true } } } } as const;

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        items: true,
        payments: true,
        claims: { select: { status: true, approvedAmount: true } },
        appointment: { select: { doctor, type: true } },
        admission: { select: { admittingDoctor: doctor } },
      },
    });
  }

  async findOne(id: string, actor?: AuthUserDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, ...(actor && { hospitalId: actor.hospitalId }),
        ...(actor?.role === Role.PATIENT && { patientId: actor.patientProfileId ?? '',
          patient: { userId: actor.id, deletedAt: null } }) },
      include: {
        patient: true,
        items: true,
        payments: true,
        claims: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (actor) {
      if (actor.role !== Role.PATIENT) assertBranchAccess(actor, invoice.branchId);
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
      include: { items: true, patient: true, payments: true },
    });
  }

  async collectPayment(invoiceId: string, dto: CollectPaymentDto, cashierUserId: string, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      if (actor) {
        assertBranchAccess(actor, invoice.branchId);
        if (invoice.hospitalId !== actor.hospitalId) throw new NotFoundException('Invoice not found');
      }

      const currentPaid = Number(invoice.paidAmount);
      const total = Number(invoice.totalAmount);
      if (invoice.status === 'CANCELLED' || !Number.isFinite(dto.amount) || dto.amount <= 0 ||
        Math.round(dto.amount * 100) > Math.round((total - currentPaid) * 100)) {
        throw new BadRequestException('Enter a positive payment within the outstanding balance.');
      }
      const newPaid = Math.round((currentPaid + dto.amount) * 100) / 100;

      let status = 'PARTIALLY_PAID';
      if (newPaid >= total) {
        status = 'PAID';
      }

      const updated = await tx.invoice.updateMany({
        where: { id: invoiceId, paidAmount: invoice.paidAmount, status: invoice.status, totalAmount: invoice.totalAmount },
        data: { paidAmount: newPaid, status },
      });
      if (updated.count !== 1) throw new ConflictException('The invoice balance changed. Refresh before recording payment.');

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

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { payments: true, items: true },
      });
    });
  }

  async getInsuranceClaims(actor?: AuthUserDto, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (actor.role === Role.PATIENT) {
        if (!actor.patientProfileId) return [];
        where.patientId = actor.patientProfileId;
        where.patient = { userId: actor.id, deletedAt: null };
      }
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

  async calculateIPDCharges(admissionId: string, actor?: AuthUserDto) {
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: true,
        ward: true,
        bed: true,
        invoices: { include: { items: true, payments: true } },
      },
    });
    if (!admission) throw new NotFoundException('Admission record not found');
    if (actor) assertBranchAccess(actor, admission.branchId);

    const admittedAt = new Date(admission.admittedAt);
    const endAt = admission.dischargedAt ? new Date(admission.dischargedAt) : new Date();
    const diffMs = Math.max(0, endAt.getTime() - admittedAt.getTime());
    const daysStayed = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const roomDailyRate = Number(admission.bed.dailyRate || 1000);

    let invoice = admission.invoices?.[0];
    if (!invoice) {
      invoice = await this.createInvoice({
        patientId: admission.patientId,
        admissionId: admission.id,
        hospitalId: admission.hospitalId,
        branchId: admission.branchId,
        items: [
          {
            description: `Room Rent (${admission.ward.name} Bed ${admission.bed.bedNumber}) - ${daysStayed} Day(s)`,
            category: 'ROOM',
            quantity: daysStayed,
            unitPrice: roomDailyRate,
          },
          {
            description: 'Inpatient Nursing & Bedside Care Charges',
            category: 'PROCEDURE',
            quantity: daysStayed,
            unitPrice: 250,
          },
        ],
        notes: `Auto-generated IPD Inpatient Billing for ${admission.admissionNumber}`,
      });
    }

    return this.findOne(invoice.id, actor);
  }

  async recordAdvancePayment(dto: AdvancePaymentDto, cashierUserId: string, actor?: AuthUserDto) {
    let invoice = await this.prisma.invoice.findFirst({
      where: { admissionId: dto.admissionId },
    });

    if (!invoice) {
      invoice = await this.calculateIPDCharges(dto.admissionId, actor);
    }

    return this.collectPayment(
      invoice.id,
      {
        invoiceId: invoice.id,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionReference: dto.transactionReference,
        notes: dto.notes ? `[Advance Payment] ${dto.notes}` : '[Advance Payment]',
      },
      cashierUserId,
      actor
    );
  }
}
