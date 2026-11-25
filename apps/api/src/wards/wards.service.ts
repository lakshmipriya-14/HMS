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

    const wards = await this.prisma.ward.findMany({
      where,
      include: {
        beds: {
          include: {
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
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
                  },
                },
                admittingDoctor: {
                  include: {
                    employee: {
                      include: {
                        user: { select: { firstName: true, lastName: true } },
                      },
                    },
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
        },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { floorNumber: 'asc' },
    });

    return wards.map((w) => {
      const totalBeds = w.beds.length;
      const occupiedBeds = w.beds.filter((b) => b.status === 'OCCUPIED').length;
      const availableBeds = w.beds.filter((b) => b.status === 'AVAILABLE').length;
      const maintenanceBeds = w.beds.filter((b) => b.status === 'MAINTENANCE').length;
      const cleaningBeds = w.beds.filter((b) => b.status === 'CLEANING').length;
      const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      const enrichedBeds = w.beds.map((b) => {
        const activeAdm = b.admissions?.[0];
        const patientName = activeAdm?.patient
          ? `${activeAdm.patient.firstName} ${activeAdm.patient.lastName}`.trim()
          : b.currentPatientName || null;
        const doctorName = activeAdm?.admittingDoctor?.employee?.user
          ? `Dr. ${activeAdm.admittingDoctor.employee.user.firstName} ${activeAdm.admittingDoctor.employee.user.lastName}`.trim()
          : null;

        return {
          ...b,
          dailyRate: Number(b.dailyRate),
          currentPatientName: patientName,
          patientDetails: activeAdm?.patient || null,
          activeAdmission: activeAdm
            ? {
                id: activeAdm.id,
                admissionNumber: activeAdm.admissionNumber,
                admittedAt: activeAdm.admittedAt,
                admissionReason: activeAdm.admissionReason,
                initialDiagnosis: activeAdm.initialDiagnosis,
                doctorName,
                departmentName: activeAdm.admittingDoctor?.department?.name || null,
              }
            : null,
        };
      });

      return {
        ...w,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        cleaningBeds,
        bedOccupancyRate,
        beds: enrichedBeds,
      };
    });
  }

  async getBedCensus(actor: AuthUserDto, branchId?: string) {
    const wards = await this.findAllWards(actor, branchId);

    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let maintenanceBeds = 0;
    let cleaningBeds = 0;

    const deptMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
      occupancyRate: number;
    }>();

    for (const w of wards) {
      totalBeds += w.totalBeds;
      occupiedBeds += w.occupiedBeds;
      availableBeds += w.availableBeds;
      maintenanceBeds += w.maintenanceBeds;
      cleaningBeds += w.cleaningBeds;

      const deptId = w.department?.id || 'UNASSIGNED';
      const deptName = w.department?.name || 'General Facility';
      const deptCode = w.department?.code || 'GEN';

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          departmentCode: deptCode,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          occupancyRate: 0,
        });
      }

      const d = deptMap.get(deptId)!;
      d.totalBeds += w.totalBeds;
      d.occupiedBeds += w.occupiedBeds;
      d.availableBeds += w.availableBeds;
    }

    const departmentUtilization = Array.from(deptMap.values()).map((d) => ({
      ...d,
      occupancyRate: d.totalBeds > 0 ? Math.round((d.occupiedBeds / d.totalBeds) * 100) : 0,
    }));

    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      summary: {
        totalWards: wards.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        cleaningBeds,
        bedOccupancyRate,
      },
      departmentUtilization,
      wards,
    };
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

  async createWard(
    actor: AuthUserDto,
    dto: {
      name: string;
      code: string;
      genderAllowed?: string;
      floorNumber?: number;
      departmentId?: string;
      branchId?: string;
    }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId);
    if (!scope.branchId) {
      throw new BadRequestException('Branch ID is required to create a ward.');
    }
    assertBranchAccess(actor, scope.branchId);

    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.ward.findFirst({
      where: { code, hospitalId: scope.hospitalId },
    });
    if (existing) {
      throw new BadRequestException(`Ward code "${code}" is already in use.`);
    }

    return this.prisma.ward.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        departmentId: dto.departmentId || null,
        name: dto.name.trim(),
        code,
        genderAllowed: dto.genderAllowed || 'ANY',
        floorNumber: dto.floorNumber || 1,
        totalBeds: 0,
        occupiedBeds: 0,
      },
      include: {
        department: true,
        beds: true,
      },
    });
  }

  async updateWard(
    actor: AuthUserDto,
    id: string,
    dto: {
      name?: string;
      genderAllowed?: string;
      floorNumber?: number;
      departmentId?: string;
    }
  ) {
    const ward = await this.prisma.ward.findUnique({ where: { id } });
    if (!ward) throw new NotFoundException('Ward not found');
    assertBranchAccess(actor, ward.branchId);

    return this.prisma.ward.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.genderAllowed ? { genderAllowed: dto.genderAllowed } : {}),
        ...(dto.floorNumber !== undefined ? { floorNumber: dto.floorNumber } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId || null } : {}),
      },
      include: {
        department: true,
        beds: true,
      },
    });
  }

  async createBed(
    actor: AuthUserDto,
    wardId: string,
    dto: {
      roomNumber: string;
      bedNumber: string;
      type?: string;
      dailyRate?: number;
      status?: string;
    }
  ) {
    const ward = await this.prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) throw new NotFoundException('Ward not found');
    assertBranchAccess(actor, ward.branchId);

    const roomNumber = dto.roomNumber.trim().toUpperCase();
    const bedNumber = dto.bedNumber.trim().toUpperCase();

    const existingBed = await this.prisma.bed.findFirst({
      where: { wardId, roomNumber, bedNumber },
    });
    if (existingBed) {
      throw new BadRequestException(`Bed ${bedNumber} in room ${roomNumber} already exists in this ward.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const bed = await tx.bed.create({
        data: {
          hospitalId: ward.hospitalId,
          branchId: ward.branchId,
          wardId,
          roomNumber,
          bedNumber,
          type: dto.type || 'STANDARD',
          dailyRate: dto.dailyRate ?? 1000.0,
          status: dto.status || 'AVAILABLE',
        },
      });

      await tx.ward.update({
        where: { id: wardId },
        data: { totalBeds: { increment: 1 } },
      });

      return bed;
    });
  }

  async updateBedStatus(actor: AuthUserDto, bedId: string, status: string) {
    const bed = await this.prisma.bed.findUnique({
      where: { id: bedId },
      include: { ward: true },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    assertBranchAccess(actor, bed.branchId);

    if (bed.status === 'OCCUPIED' && status !== 'OCCUPIED') {
      throw new BadRequestException('Cannot change status of occupied bed directly. Please discharge or transfer the patient.');
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: { status },
    });
  }

  async updateBed(
    actor: AuthUserDto,
    bedId: string,
    dto: { roomNumber?: string; bedNumber?: string; type?: string; dailyRate?: number }
  ) {
    const bed = await this.prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new NotFoundException('Bed not found');
    assertBranchAccess(actor, bed.branchId);

    const updated = await this.prisma.bed.update({
      where: { id: bedId },
      data: {
        ...(dto.roomNumber ? { roomNumber: dto.roomNumber } : {}),
        ...(dto.bedNumber ? { bedNumber: dto.bedNumber } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.dailyRate !== undefined ? { dailyRate: dto.dailyRate } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: bed.hospitalId,
        branchId: bed.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'UPDATE',
        resource: 'BED',
        resourceId: bedId,
        details: dto,
      },
    });

    return updated;
  }

  async deleteBed(actor: AuthUserDto, bedId: string) {
    const bed = await this.prisma.bed.findUnique({
      where: { id: bedId },
      include: { admissions: { where: { status: 'ADMITTED' } } },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    assertBranchAccess(actor, bed.branchId);

    if (bed.status === 'OCCUPIED' || bed.admissions.length > 0) {
      throw new BadRequestException('Cannot delete an occupied bed with active inpatient admissions');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bed.delete({ where: { id: bedId } });
      await tx.ward.update({
        where: { id: bed.wardId },
        data: { totalBeds: { decrement: 1 } },
      });
      await tx.auditLog.create({
        data: {
          hospitalId: bed.hospitalId,
          branchId: bed.branchId,
          userId: actor.id,
          userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
          userRole: actor.role,
          action: 'DELETE',
          resource: 'BED',
          resourceId: bedId,
          details: { roomNumber: bed.roomNumber, bedNumber: bed.bedNumber },
        },
      });
      return { message: 'Bed deleted successfully' };
    });
  }

  async bulkUpdateBedStatus(actor: AuthUserDto, bedIds: string[], status: string) {
    const beds = await this.prisma.bed.findMany({
      where: { id: { in: bedIds } },
    });

    const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED' && status !== 'OCCUPIED');
    if (occupiedBeds.length > 0) {
      throw new BadRequestException('Some selected beds are currently occupied and cannot be changed.');
    }

    const targetIds = beds.map((b) => b.id);
    await this.prisma.bed.updateMany({
      where: { id: { in: targetIds } },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: actor.hospitalId,
        branchId: actor.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'UPDATE',
        resource: 'BED_BULK',
        details: { count: targetIds.length, status },
      },
    });

    return { updatedCount: targetIds.length, status };
  }
}
