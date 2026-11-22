import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdmitPatientDto, DischargePatientDto, AuthUserDto } from '@multispeciality-hms/contracts';
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
      const ward = await this.prisma.ward.findUnique({ where: { id: wardId }, select: { hospitalId: true, branchId: true } });
      if (!ward) throw new NotFoundException('Ward not found');
      assertBranchAccess(actor, ward.branchId);
    }
    return this.prisma.bed.findMany({
      where: { wardId },
      orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
    });
  }

  async admitPatient(dto: AdmitPatientDto, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check bed availability
      const bed = await tx.bed.findUnique({
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
