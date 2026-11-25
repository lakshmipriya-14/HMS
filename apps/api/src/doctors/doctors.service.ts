import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, DoctorRoundNoteDto, Role } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';
import * as bcrypt from 'bcryptjs';

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
                isActive: true,
              },
            },
          },
        },
        qualifications: true,
        schedules: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
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

  async createDoctor(
    actor: AuthUserDto,
    dto: {
      userId?: string;
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      branchId?: string;
      departmentId: string;
      designation: string;
      licenseNumber: string;
      specialization: string;
      subSpecialization?: string;
      experienceYears?: number;
      consultationFee?: number;
      followUpFee?: number;
      opdFee?: number;
      ipdAvailable?: boolean;
      consultationDurationMin?: number;
      availableDays?: string[];
      shift?: string;
    }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId, dto.departmentId);
    if (!scope.branchId) {
      throw new BadRequestException('Branch ID is required.');
    }
    assertBranchAccess(actor, scope.branchId);

    const licenseNumber = dto.licenseNumber.trim().toUpperCase();
    const existingDoc = await this.prisma.doctor.findUnique({
      where: { licenseNumber },
    });
    if (existingDoc) {
      throw new ConflictException(`Doctor with license number "${licenseNumber}" already exists.`);
    }

    return this.prisma.$transaction(async (tx) => {
      let userId = dto.userId;
      let employeeId: string;

      if (!userId) {
        if (!dto.email || !dto.firstName || !dto.lastName) {
          throw new BadRequestException('Email, first name, and last name are required if no existing user is linked.');
        }
        const email = dto.email.toLowerCase().trim();
        const existingUser = await tx.user.findFirst({
          where: { email, hospitalId: scope.hospitalId },
        });
        if (existingUser) {
          throw new ConflictException(`User with email "${email}" already exists.`);
        }

        const password = dto.password || 'UyirinaiTeamDemo!24';
        const passwordHash = await bcrypt.hash(password, 10);

        const createdUser = await tx.user.create({
          data: {
            hospitalId: scope.hospitalId,
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phone: dto.phone?.trim() || '0000000000',
            isActive: true,
          },
        });
        userId = createdUser.id;

        const doctorRole = await tx.role.findFirst({ where: { name: Role.DOCTOR } });
        if (doctorRole) {
          await tx.userRole.create({
            data: {
              hospitalId: scope.hospitalId,
              userId,
              roleId: doctorRole.id,
              branchId: scope.branchId,
              departmentId: dto.departmentId,
              scopeKey: `branch:${scope.branchId}:department:${dto.departmentId}`,
            },
          });
        }

        const employee = await tx.employee.create({
          data: {
            hospitalId: scope.hospitalId,
            userId,
            branchId: scope.branchId,
            departmentId: dto.departmentId,
            employeeCode: `DOC-${Date.now().toString().slice(-6)}`,
            designation: dto.designation,
            dateOfJoining: new Date(),
            status: 'ACTIVE',
          },
        });
        employeeId = employee.id;
      } else {
        const emp = await tx.employee.findFirst({
          where: { userId, hospitalId: scope.hospitalId },
        });
        if (!emp) {
          const employee = await tx.employee.create({
            data: {
              hospitalId: scope.hospitalId,
              userId,
              branchId: scope.branchId,
              departmentId: dto.departmentId,
              employeeCode: `DOC-${Date.now().toString().slice(-6)}`,
              designation: dto.designation,
              dateOfJoining: new Date(),
              status: 'ACTIVE',
            },
          });
          employeeId = employee.id;
        } else {
          employeeId = emp.id;
        }
      }

      const doctor = await tx.doctor.create({
        data: {
          hospitalId: scope.hospitalId,
          branchId: scope.branchId!,
          employeeId,
          departmentId: dto.departmentId,
          designation: dto.designation,
          licenseNumber,
          specialization: dto.specialization,
          subSpecialization: dto.subSpecialization || null,
          experienceYears: dto.experienceYears || 0,
          consultationFee: dto.consultationFee ?? 500,
          followUpFee: dto.followUpFee ?? 300,
          opdFee: dto.opdFee ?? 500,
          ipdAvailable: dto.ipdAvailable ?? true,
          consultationDurationMin: dto.consultationDurationMin ?? 15,
          availableDays: dto.availableDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          shift: dto.shift || 'MORNING',
          isAvailableToday: true,
        },
        include: {
          department: true,
          employee: { include: { user: true } },
        },
      });

      return doctor;
    });
  }

  async updateDoctor(
    actor: AuthUserDto,
    id: string,
    dto: {
      departmentId?: string;
      designation?: string;
      specialization?: string;
      subSpecialization?: string;
      experienceYears?: number;
      consultationFee?: number;
      followUpFee?: number;
      opdFee?: number;
      ipdAvailable?: boolean;
      consultationDurationMin?: number;
      availableDays?: string[];
      shift?: string;
      isAvailableToday?: boolean;
    }
  ) {
    const doctor = await this.findOne(id, actor);
    assertBranchAccess(actor, doctor.branchId);

    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...(dto.departmentId ? { departmentId: dto.departmentId } : {}),
        ...(dto.designation ? { designation: dto.designation } : {}),
        ...(dto.specialization ? { specialization: dto.specialization } : {}),
        ...(dto.subSpecialization !== undefined ? { subSpecialization: dto.subSpecialization || null } : {}),
        ...(dto.experienceYears !== undefined ? { experienceYears: dto.experienceYears } : {}),
        ...(dto.consultationFee !== undefined ? { consultationFee: dto.consultationFee } : {}),
        ...(dto.followUpFee !== undefined ? { followUpFee: dto.followUpFee } : {}),
        ...(dto.opdFee !== undefined ? { opdFee: dto.opdFee } : {}),
        ...(dto.ipdAvailable !== undefined ? { ipdAvailable: dto.ipdAvailable } : {}),
        ...(dto.consultationDurationMin !== undefined ? { consultationDurationMin: dto.consultationDurationMin } : {}),
        ...(dto.availableDays ? { availableDays: dto.availableDays } : {}),
        ...(dto.shift ? { shift: dto.shift } : {}),
        ...(dto.isAvailableToday !== undefined ? { isAvailableToday: dto.isAvailableToday } : {}),
      },
      include: {
        department: true,
        employee: { include: { user: true } },
      },
    });
  }

  async updateSchedule(
    actor: AuthUserDto,
    id: string,
    dto: { availableDays?: string[]; shift?: string; isAvailableToday?: boolean }
  ) {
    const doctor = await this.findOne(id, actor);
    assertBranchAccess(actor, doctor.branchId);

    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...(dto.availableDays ? { availableDays: dto.availableDays } : {}),
        ...(dto.shift ? { shift: dto.shift } : {}),
        ...(dto.isAvailableToday !== undefined ? { isAvailableToday: dto.isAvailableToday } : {}),
      },
      include: {
        department: true,
        employee: { include: { user: true } },
      },
    });
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

  async toggleDoctorStatus(actor: AuthUserDto, id: string, status?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    assertBranchAccess(actor, doctor.branchId);

    const currentUserActive = doctor.employee.user.isActive;
    const newActiveState = status ? status === 'ACTIVE' : !currentUserActive;
    const newEmployeeStatus = status || (newActiveState ? 'ACTIVE' : 'INACTIVE');

    if (!newActiveState) {
      const activeAppts = await this.prisma.appointment.count({
        where: {
          doctorId: id,
          status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] },
        },
      });
      if (activeAppts > 0) {
        throw new BadRequestException(
          `Cannot deactivate doctor with ${activeAppts} active appointments. Please reassign or cancel appointments first.`
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctor.employee.userId },
        data: { isActive: newActiveState },
      }),
      this.prisma.employee.update({
        where: { id: doctor.employeeId },
        data: { status: newEmployeeStatus },
      }),
      this.prisma.auditLog.create({
        data: {
          hospitalId: doctor.hospitalId,
          branchId: doctor.branchId,
          userId: actor.id,
          userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
          userRole: actor.role,
          action: newActiveState ? 'ACTIVATE' : 'DEACTIVATE',
          resource: 'DOCTOR',
          resourceId: id,
          details: { isActive: newActiveState, employeeStatus: newEmployeeStatus },
        },
      }),
    ]);

    return { id, isActive: newActiveState, status: newEmployeeStatus };
  }
}
