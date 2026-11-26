import { auditClinicalOrder, resolveClinicalOrderScope } from '../common/utils/clinical-order-scope';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabOrderDto, EnterLabResultsDto, AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class LaboratoryService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.labOrder.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `LAB-${year}-${sequence}`;
  }

  async getCatalogue() {
    return this.prisma.labTest.findMany({
      where: { isActive: true },
      include: { parameters: true },
      orderBy: { category: 'asc' },
    });
  }

  async createOrder(dto: CreateLabOrderDto, actor: AuthUserDto) {
    const doctor = await resolveClinicalOrderScope(this.prisma, actor, dto.doctorId, dto.patientId);

    const orderNumber = await this.generateOrderNumber();
    const barcode = `BAR-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.create({
        data: {
          orderNumber,
          barcode,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          hospitalId: doctor.hospitalId,
          branchId: doctor.branchId,
          priority: dto.priority || 'ROUTINE',
          clinicalNotes: dto.clinicalNotes,
          status: 'ORDERED',
          orderItems: {
            create: dto.testIds.map((testId) => ({ labTestId: testId })),
          },
        },
        include: {
          patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
          orderItems: { include: { labTest: { include: { parameters: true } } } },
        },
      });
      await auditClinicalOrder(tx, actor, doctor, 'LAB_ORDER', order.id);
      return order;
    });
  }

  async getWorklist(actor?: AuthUserDto, branchId?: string) {
    const isDoctor = actor?.role === Role.DOCTOR;
    if (isDoctor && !actor.doctorProfileId) throw new ForbiddenException('Missing doctor assignment.');
    const where: any = {
      status: { in: ['ORDERED', 'COLLECTED', 'RECEIVED_IN_LAB', 'PROCESSING'] },
    };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (isDoctor) {
        where.doctorId = actor.doctorProfileId;
        if (actor.permissions.includes('LAB_RESULTS:VIEW')) delete where.status;
      }
      if (scope.departmentId) where.doctor = { departmentId: scope.departmentId };
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    const rows = await this.prisma.labOrder.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, gender: true, dateOfBirth: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        orderItems: { include: { labTest: { include: { parameters: true } } } },
        results: { include: { parameter: true } },
      },
    });
    if (!isDoctor) return rows;
    return rows.map((row) => ({
      ...row, results: row.reportReleasedAt && actor.permissions.includes('LAB_RESULTS:VIEW') ? row.results : [],
    }));
  }

  async collectSample(orderId: string, barcode?: string, actor?: AuthUserDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Lab order not found');
    if (actor) {
      assertBranchAccess(actor, order.branchId);
    }

    return this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status: 'COLLECTED',
        sampleCollectedAt: new Date(),
        ...(barcode ? { barcode } : {}),
      },
    });
  }

  async enterResults(dto: EnterLabResultsDto, actor?: AuthUserDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Lab order not found');
    if (actor) {
      assertBranchAccess(actor, order.branchId);
    }

    // Delete previous draft results for this order if any
    await this.prisma.labResult.deleteMany({ where: { labOrderId: dto.orderId } });

    for (const r of dto.results) {
      await this.prisma.labResult.create({
        data: {
          labOrderId: dto.orderId,
          parameterId: r.testParameterId,
          measuredValue: r.measuredValue,
          unit: r.unit,
          referenceRange: r.referenceRange,
          isAbnormal: r.isAbnormal,
          isCritical: r.isCritical,
          remarks: r.remarks,
          technicianNotes: dto.technicianNotes,
        },
      });
    }

    return this.prisma.labOrder.update({
      where: { id: dto.orderId },
      data: { status: 'PROCESSING' },
      include: { results: true },
    });
  }

  async releaseReport(orderId: string, releasedByUserId: string, actor?: AuthUserDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Lab order not found');
    if (actor) {
      assertBranchAccess(actor, order.branchId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.labOrder.updateMany({
        where: { id: orderId, reportReleasedAt: null },
        data: { status: 'COMPLETED', reportReleasedAt: new Date(), releasedByUserId },
      });
      if (updated.count) {
        const doctor = await tx.doctor.findUniqueOrThrow({
          where: { id: order.doctorId },
          select: { employee: { select: { userId: true } } },
        });
        await tx.notification.create({ data: {
          hospitalId: order.hospitalId, branchId: order.branchId, userId: doctor.employee.userId,
          title: 'Lab report available', message: `Lab order ${order.orderNumber} has a released report.`,
          type: 'LAB_RESULT',
        } });
      }
      return tx.labOrder.findUniqueOrThrow({ where: { id: orderId } });
    });
  }
}
