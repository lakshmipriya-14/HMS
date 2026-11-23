import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdmitPatientDto, DischargePatientDto, TransferBedDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class WardsService {
  constructor(private prisma: PrismaService) {}

  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.admission.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ADM-${year}-${sequence}`;
  }

  async findAllWards(actor?: AuthUserDto, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.ward.findMany({
      where,
      include: {
        beds: true,
        department: { select: { name: true, code: true } },
      },
      orderBy: { floorNumber: 'asc' },
    });
  }

  async getBeds(wardId: string, actor?: AuthUserDto) {
    if (actor) {
      const ward: any = await this.prisma.ward.findUnique({ where: { id: wardId }, select: { hospitalId: true, branchId: true } });
      if (!ward) throw new NotFoundException('Ward not found');
      assertBranchAccess(actor, ward.branchId);
    }
    return this.prisma.bed.findMany({
      where: { wardId },
      orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
    });
  }

  async findAdmissions(actor?: AuthUserDto, patientId?: string, status?: string, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    return this.prisma.admission.findMany({
      where,
      orderBy: { admittedAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            phone: true,
            allergies: true,
          },
        },
        ward: true,
        bed: true,
        admittingDoctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: { select: { name: true } },
          },
        },
        vitals: { take: 1, orderBy: { createdAt: 'desc' } },
        invoices: true,
      },
    });
  }

  async findOneAdmission(id: string, actor?: AuthUserDto) {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
      include: {
        patient: true,
        ward: true,
        bed: true,
        admittingDoctor: {
          include: {
            employee: { include: { user: true } },
            department: true,
          },
        },
        vitals: { orderBy: { createdAt: 'desc' } },
        nursingTasks: { orderBy: { dueTime: 'asc' } },
        invoices: { include: { items: true, payments: true } },
      },
    });
    if (!admission) throw new NotFoundException('Admission record not found');
    if (actor) {
      assertBranchAccess(actor, admission.branchId);
    }
    return admission;
  }

  async admitPatient(dto: AdmitPatientDto, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check bed availability
      const bed: any = await tx.bed.findUnique({
        where: { id: dto.bedId },
      });

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new BadRequestException('Selected bed is not currently available for admission');
      }

      if (actor) {
        assertBranchAccess(actor, bed.branchId);
      }

      const patient = await tx.patient.findUnique({ where: { id: dto.patientId } });
      if (!patient) throw new NotFoundException('Patient not found');

      const admissionNumber = await this.generateAdmissionNumber();

      // Create admission record
      const admission = await tx.admission.create({
        data: {
          admissionNumber,
          patientId: dto.patientId,
          admittingDoctorId: dto.admittingDoctorId,
          wardId: dto.wardId,
          bedId: dto.bedId,
          status: 'ADMITTED',
          admissionReason: dto.admissionReason,
          initialDiagnosis: dto.initialDiagnosis,
          admittedAt: new Date(),
          hospitalId: bed.hospitalId,
          branchId: bed.branchId,
        },
      });

      // Update bed to OCCUPIED
      await tx.bed.update({
        where: { id: dto.bedId },
        data: {
          status: 'OCCUPIED',
          currentPatientId: patient.id,
          currentPatientName: `${patient.firstName} ${patient.lastName}`,
        },
      });

      // Update ward occupancy
      await tx.ward.update({
        where: { id: dto.wardId },
        data: { occupiedBeds: { increment: 1 } },
      });

      return admission;
    });
  }

  async transferBed(dto: TransferBedDto, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({ where: { id: dto.admissionId } });
      if (!admission || admission.status !== 'ADMITTED') {
        throw new BadRequestException('Admission record is not currently active');
      }

      const targetBed = await tx.bed.findUnique({ where: { id: dto.targetBedId } });
      if (!targetBed || targetBed.status !== 'AVAILABLE') {
        throw new BadRequestException('Selected target bed is not currently available');
      }

      if (actor) {
        assertBranchAccess(actor, targetBed.branchId);
      }

      const patient = await tx.patient.findUnique({ where: { id: admission.patientId } });

      // 1. Release old bed to HOUSEKEEPING
      await tx.bed.update({
        where: { id: admission.bedId },
        data: {
          status: 'HOUSEKEEPING',
          currentPatientId: null,
          currentPatientName: null,
        },
      });

      // 2. Decrement old ward count if ward changed
      if (admission.wardId !== dto.targetWardId) {
        await tx.ward.update({
          where: { id: admission.wardId },
          data: { occupiedBeds: { decrement: 1 } },
        });
        await tx.ward.update({
          where: { id: dto.targetWardId },
          data: { occupiedBeds: { increment: 1 } },
        });
      }

      // 3. Occupy target bed
      await tx.bed.update({
        where: { id: dto.targetBedId },
        data: {
          status: 'OCCUPIED',
          currentPatientId: patient?.id || null,
          currentPatientName: patient ? `${patient.firstName} ${patient.lastName}` : null,
        },
      });

      // 4. Update admission record
      const updated = await tx.admission.update({
        where: { id: dto.admissionId },
        data: {
          wardId: dto.targetWardId,
          bedId: dto.targetBedId,
        },
        include: { ward: true, bed: true },
      });

      // 5. Audit Log
      if (actor) {
        await tx.auditLog.create({
          data: {
            hospitalId: actor.hospitalId || undefined,
            branchId: actor.branchId || undefined,
            userId: actor.id,
            userEmail: actor.email,
            userRole: actor.role,
            action: 'BED_TRANSFER',
            resource: 'ADMISSION',
            resourceId: admission.id,
            details: {
              oldBedId: admission.bedId,
              newBedId: dto.targetBedId,
              reason: dto.reason,
            },
          },
        });
      }

      return updated;
    });
  }

  async cancelAdmission(admissionId: string, reason: string, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({ where: { id: admissionId } });
      if (!admission || admission.status !== 'ADMITTED') {
        throw new BadRequestException('Admission is not currently active');
      }

      if (actor) {
        assertBranchAccess(actor, admission.branchId);
      }

      // Release bed to AVAILABLE
      await tx.bed.update({
        where: { id: admission.bedId },
        data: {
          status: 'AVAILABLE',
          currentPatientId: null,
          currentPatientName: null,
        },
      });

      // Decrement ward occupancy
      await tx.ward.update({
        where: { id: admission.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });

      // Mark admission CANCELLED
      const updated = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: 'CANCELLED',
          dischargeSummary: `Cancelled: ${reason}`,
        },
      });

      return updated;
    });
  }

  async dischargePatient(admissionId: string, dto: DischargePatientDto, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({
        where: { id: admissionId },
      });
      if (!admission || admission.status !== 'ADMITTED') {
        throw new BadRequestException('Admission record is not currently active');
      }

      if (actor) {
        assertBranchAccess(actor, admission.branchId);
      }

      // Mark admission discharged
      const updated = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: 'DISCHARGED',
          dischargedAt: new Date(),
          dischargeSummary: dto.dischargeSummary,
        },
      });

      // Release bed for housekeeping
      await tx.bed.update({
        where: { id: admission.bedId },
        data: {
          status: 'HOUSEKEEPING',
          currentPatientId: null,
          currentPatientName: null,
        },
      });

      // Decrement occupied bed count in ward
      await tx.ward.update({
        where: { id: admission.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });

      return updated;
    });
  }
}
