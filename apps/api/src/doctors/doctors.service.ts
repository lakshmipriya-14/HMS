import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, DoctorRoundNoteDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(actor?: AuthUserDto, departmentId?: string, designation?: string, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId, departmentId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
      if (scope.departmentId) where.departmentId = scope.departmentId;
    } else {
      if (branchId) where.branchId = branchId;
      if (departmentId) where.departmentId = departmentId;
    }
    if (designation) where.designation = designation;

    return this.prisma.doctor.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        qualifications: true,
        schedules: { where: { isActive: true } },
      },
    });
  }

  async findOne(id: string, actor?: AuthUserDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        employee: {
          include: { user: true },
        },
        qualifications: true,
        schedules: true,
        leaves: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (actor) {
      assertBranchAccess(actor, doctor.branchId);
    }
    return doctor;
  }

  async getInpatients(actor?: AuthUserDto, branchId?: string) {
    const where: any = { status: 'ADMITTED' };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
      if (actor.doctorProfileId) {
        where.admittingDoctorId = actor.doctorProfileId;
      }
    }

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
            bloodGroup: true,
            allergies: true,
          },
        },
        ward: true,
        bed: true,
        vitals: { take: 3, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async recordProgressNote(dto: DoctorRoundNoteDto, actor?: AuthUserDto) {
    const admission = await this.prisma.admission.findUnique({
      where: { id: dto.admissionId },
      include: { patient: true, ward: true, bed: true },
    });
    if (!admission || admission.status !== 'ADMITTED') {
      throw new NotFoundException('Active inpatient admission not found');
    }

    if (actor) {
      await this.prisma.auditLog.create({
        data: {
          hospitalId: admission.hospitalId,
          branchId: admission.branchId,
          userId: actor.id,
          userEmail: actor.email,
          userRole: actor.role,
          action: 'DOCTOR_ROUND',
          resource: 'ADMISSION',
          resourceId: admission.id,
          details: {
            progressNote: dto.progressNote,
            diagnosisUpdate: dto.diagnosisUpdate,
            treatmentPlanUpdate: dto.treatmentPlanUpdate,
            followUpInstructions: dto.followUpInstructions,
          },
        },
      });
    }

    return {
      admissionId: admission.id,
      patientName: `${admission.patient.firstName} ${admission.patient.lastName}`,
      progressNote: dto.progressNote,
      recordedAt: new Date().toISOString(),
    };
  }
}
