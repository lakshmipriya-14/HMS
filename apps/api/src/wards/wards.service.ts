import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdmitPatientDto, DischargePatientDto, TransferBedDto } from '@multispeciality-hms/contracts';

@Injectable()
export class WardsService {
  constructor(private prisma: PrismaService) {}

  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.admission.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ADM-${year}-${sequence}`;
  }

  async findAllWards() {
    return this.prisma.ward.findMany({
      include: {
        beds: true,
        department: { select: { name: true, code: true } },
      },
      orderBy: { floorNumber: 'asc' },
    });
  }

  async getBeds(wardId: string) {
    return this.prisma.bed.findMany({
      where: { wardId },
      orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
    });
  }

  async admitPatient(dto: AdmitPatientDto) {
    return this.prisma.$transaction(async (tx) => {
      // Check bed availability
      const bed = await tx.bed.findUnique({
        where: { id: dto.bedId },
      });

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new BadRequestException('Selected bed is not currently available for admission');
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

  async dischargePatient(admissionId: string, dto: DischargePatientDto) {
    return this.prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({
        where: { id: admissionId },
      });
      if (!admission || admission.status !== 'ADMITTED') {
        throw new BadRequestException('Admission record is not currently active');
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

      // Release bed to CLEANING status for turnover
      await tx.bed.update({
        where: { id: admission.bedId },
        data: {
          status: 'CLEANING',
          currentPatientId: null,
          currentPatientName: null,
        },
      });

      // Decrement ward occupancy
      await tx.ward.update({
        where: { id: admission.wardId },
        data: { occupiedBeds: { decrement: 1 } },
      });

      return updated;
    });
  }
}
