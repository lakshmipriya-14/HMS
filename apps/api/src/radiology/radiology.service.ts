import { auditClinicalOrder, resolveClinicalOrderScope } from '../common/utils/clinical-order-scope';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { resolveOperationalScope } from '../common/utils/operational-scope';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, CreateRadiologyOrderDto, UploadRadiologyReportDto, Role } from '@multispeciality-hms/contracts';

@Injectable()
export class RadiologyService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.radiologyOrder.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RAD-${year}-${sequence}`;
  }

  async getCatalogue() {
    return this.prisma.radiologyTest.findMany({
      where: { isActive: true },
      orderBy: { modality: 'asc' },
    });
  }

  async createOrder(dto: CreateRadiologyOrderDto, actor: AuthUserDto) {
    const doctor = await resolveClinicalOrderScope(this.prisma, actor, dto.doctorId, dto.patientId);

    const orderNumber = await this.generateOrderNumber();

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.radiologyOrder.create({
        data: {
          orderNumber,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          testId: dto.testId,
          priority: dto.priority || 'ROUTINE',
          clinicalIndication: dto.clinicalIndication,
          status: 'ORDERED',
          hospitalId: doctor.hospitalId,
          branchId: doctor.branchId,
        },
        include: {
          patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
          test: true,
        },
      });
      await auditClinicalOrder(tx, actor, doctor, 'RADIOLOGY_ORDER', order.id);
      return order;
    });
  }

  async getWorklist(actor: AuthUserDto) {
    const { hospitalId, branchId, departmentId } = resolveOperationalScope(actor);
    const isDoctor = actor.role === Role.DOCTOR;
    if (isDoctor && !actor.doctorProfileId) throw new ForbiddenException('Missing doctor assignment.');
    const rows = await this.prisma.radiologyOrder.findMany({
      where: { hospitalId, branchId, doctorId: isDoctor ? actor.doctorProfileId : undefined,
        doctor: departmentId ? { departmentId } : undefined },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, gender: true, dateOfBirth: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        test: true,
      },
    });
    if (!isDoctor) return rows;
    return rows.map((row) => row.reportReleasedAt && actor.permissions.includes('RADIOLOGY_REPORTS:VIEW')
      ? row : { ...row, findings: null, impression: null, imageUrl: null, criticalAlert: false });
  }

  async uploadReport(orderId: string, dto: UploadRadiologyReportDto, radiologistUserId: string) {
    return this.prisma.radiologyOrder.update({
      where: { id: orderId },
      data: {
        status: 'REPORT_RELEASED',
        findings: dto.findings,
        impression: dto.impression,
        criticalAlert: dto.criticalAlert,
        imageUrl: dto.imageUrl,
        reportReleasedAt: new Date(),
        releasedByUserId: radiologistUserId,
      },
      include: { test: true, patient: true },
    });
  }
}
