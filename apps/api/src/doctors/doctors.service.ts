import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, DoctorRoundNoteDto, DoctorWorkspaceDto, RequestDoctorLeaveDto, Role } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async workspace(actor: AuthUserDto): Promise<DoctorWorkspaceDto> {
    const doctorWhere = this.selfScope(actor);
    const { hospitalId, branchId } = doctorWhere;
    const doctorId = doctorWhere.id;
    const doctor = await this.prisma.doctor.findFirst({
      where: doctorWhere,
      select: {
        designation: true, specialization: true, licenseNumber: true, experienceYears: true,
        isAvailableToday: true, consultationDurationMin: true,
        branch: { select: { name: true } }, department: { select: { name: true } },
        employee: { select: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        qualifications: { select: { id: true, degree: true, institution: true, yearPassed: true }, orderBy: { yearPassed: 'desc' } },
        leaves: { select: { id: true, startDate: true, endDate: true, reason: true, isApproved: true }, orderBy: { startDate: 'desc' }, take: 50 },
        schedules: { where: { isActive: true }, select: { id: true, dayOfWeek: true, startTime: true, endTime: true }, orderBy: { startTime: 'asc' } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found.');

    const scope = { hospitalId, branchId, doctorId };
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
    const today = new Date(date + 'T00:00:00Z');
    const permitted = (permission: string, read: () => Promise<number>) =>
      actor.permissions.includes(permission) ? read() : Promise.resolve(undefined);
    const upcoming = { ...scope, appointmentDate: { gte: today }, status: { in: ['SCHEDULED', 'CONFIRMED'] } };
    const counts = await Promise.all([
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: { ...scope, appointmentDate: today } })),
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: scope })),
      permitted('CONSULTATIONS:VIEW', () => this.prisma.consultation.count({ where: { ...scope, status: 'COMPLETED' } })),
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: { ...scope, appointmentDate: today, status: 'IN_PROGRESS' } })),
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: upcoming })),
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: { ...scope, appointmentDate: today, status: 'CHECKED_IN' } })),
      permitted('LAB_ORDERS:VIEW', () => this.prisma.labOrder.count({ where: { ...scope, reportReleasedAt: null, status: { notIn: ['CANCELLED', 'REJECTED'] } } })),
      permitted('RADIOLOGY_ORDERS:VIEW', () => this.prisma.radiologyOrder.count({ where: { ...scope, reportReleasedAt: null, status: { not: 'CANCELLED' } } })),
      permitted('ADMISSIONS:VIEW', () => this.prisma.admission.count({ where: { hospitalId, branchId, admittingDoctorId: doctorId, status: 'ADMITTED' } })),
      permitted('APPOINTMENTS:VIEW', () => this.prisma.appointment.count({ where: { ...upcoming, type: 'FOLLOW_UP' } })),
      permitted('PRESCRIPTIONS:VIEW', () => this.prisma.prescription.count({ where: scope })),
      permitted('LAB_ORDERS:VIEW', () => this.prisma.labOrder.count({ where: scope })),
      permitted('RADIOLOGY_ORDERS:VIEW', () => this.prisma.radiologyOrder.count({ where: scope })),
    ]);
    const labels = ['Today’s appointments', 'Total appointments', 'Completed consultations', 'Consultations in progress',
      'Upcoming appointments', 'Patients waiting today', 'Pending lab reports', 'Pending radiology reports', 'Assigned inpatients', 'Upcoming follow-ups',
      'Prescriptions issued', 'Lab orders placed', 'Radiology orders placed'];
    const notifications = (await Promise.all(['APPOINTMENT', 'LAB_RESULT', 'OTHER'].map((category) =>
      this.prisma.notification.findMany({
        where: { hospitalId, userId: actor.id, OR: [{ branchId }, { branchId: null }],
          type: category === 'OTHER' ? { notIn: ['APPOINTMENT', 'LAB_RESULT'] } : category },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 10,
        select: { id: true, title: true, message: true, isRead: true, type: true },
      }),
    ))).flat();
    const { branch, department, employee, ...profile } = doctor;
    return {
      profile: { ...profile, ...employee.user, branch: branch.name, department: department.name,
        leaves: profile.leaves.map((leave) => ({ ...leave, startDate: leave.startDate.toISOString(), endDate: leave.endDate.toISOString() })) },
      counts: Object.fromEntries(labels.flatMap((label, index) => counts[index] === undefined ? [] : [[label, counts[index]]])),
      notifications,
    };
  }

  private selfScope(actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR || !actor.doctorProfileId) {
      throw new ForbiddenException('An active doctor assignment is required.');
    }
    const { hospitalId, branchId, departmentId } = resolveOperationalScope(actor);
    return { id: actor.doctorProfileId, hospitalId, branchId, departmentId,
      employee: { userId: actor.id, user: { deletedAt: null, isActive: true } } };
  }

  async requestLeave(actor: AuthUserDto, dto: RequestDoctorLeaveDto) {
    const parse = (value: string) => {
      const date = new Date(value + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime())
        || date.toISOString().slice(0, 10) !== value) throw new BadRequestException('Use valid YYYY-MM-DD leave dates.');
      return date;
    };
    if (typeof dto?.reason !== 'string' || !dto.reason.trim() || dto.reason.trim().length > 500) {
      throw new BadRequestException('Enter a leave reason of up to 500 characters.');
    }
    const startDate = parse(dto.startDate);
    const endDate = parse(dto.endDate);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
    if (dto.startDate < today || endDate < startDate) throw new BadRequestException('Choose a current or future leave range.');
    const where = this.selfScope(actor);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const doctor = await tx.doctor.findFirst({ where, select: { id: true, hospitalId: true, branchId: true } });
        if (!doctor) throw new NotFoundException('Doctor profile not found.');
        const overlap = await tx.doctorLeave.findFirst({
          where: { doctorId: doctor.id, startDate: { lte: endDate }, endDate: { gte: startDate } },
          select: { id: true },
        });
        if (overlap) throw new ConflictException('A leave request already overlaps these dates.');
        const leave = await tx.doctorLeave.create({ data: { doctorId: doctor.id, startDate, endDate, reason: dto.reason.trim() } });
        await tx.auditLog.create({ data: {
          hospitalId: doctor.hospitalId, branchId: doctor.branchId, userId: actor.id, userEmail: actor.email,
          userRole: actor.role, action: 'CREATE', resource: 'DOCTOR_LEAVE', resourceId: leave.id,
        } });
        return leave;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('The schedule changed while saving. Refresh and try again.');
      }
      throw error;
    }
  }

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
    if (actor?.role === Role.RECEPTIONIST) where.employee = { user: { isActive: true, deletedAt: null } };

    return this.prisma.doctor.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
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
    const scope = actor ? resolveOperationalScope(actor) : undefined;
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, ...scope },
      include: {
        department: true,
        employee: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, isActive: true } } },
        },
        qualifications: true,
        schedules: true,
        leaves: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.doctor.update({
        where: { id, hospitalId: doctor.hospitalId, branchId: doctor.branchId, departmentId: doctor.departmentId },
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
          employee: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, isActive: true } } } },
        },
      });
      await tx.auditLog.create({ data: {
        hospitalId: doctor.hospitalId, branchId: doctor.branchId, userId: actor.id, userEmail: actor.email,
        userRole: actor.role, action: 'UPDATE', resource: 'DOCTOR', resourceId: id,
      } });
      return updated;
    });
  }

  async editWorkingHours(actor: AuthUserDto, scheduleId: string, dto: { startTime: string; endTime: string }) {
    const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!clock.test(dto.startTime) || !clock.test(dto.endTime) || dto.startTime >= dto.endTime) {
      throw new BadRequestException('Enter valid working hours in HH:mm format, with the end after the start.');
    }
    const doctor = this.selfScope(actor);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.doctorSchedule.findFirst({
          where: { id: scheduleId, isActive: true, doctor },
          include: { doctor: { select: { id: true, hospitalId: true, branchId: true } } },
        });
        if (!current) throw new NotFoundException('Working hours not found.');
        const other = await tx.doctorSchedule.findMany({
          where: { id: { not: scheduleId }, doctorId: current.doctorId, dayOfWeek: current.dayOfWeek, isActive: true },
        });
        if (other.some((row) => row.startTime < dto.endTime && row.endTime > dto.startTime)) {
          throw new ConflictException('These working hours overlap another shift.');
        }
        const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
        const bookings = await tx.appointment.findMany({
          where: { doctorId: current.doctorId, appointmentDate: { gte: new Date(day + 'T00:00:00Z') },
            status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] } },
          select: { appointmentDate: true, appointmentTime: true },
        });
        const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' });
        const windows = [...other, dto];
        if (bookings.some(({ appointmentDate, appointmentTime }) =>
          weekday.format(appointmentDate).toUpperCase() === current.dayOfWeek &&
          !windows.some((row) => row.startTime <= appointmentTime && appointmentTime < row.endTime))) {
          throw new ConflictException('This change would leave an active appointment outside working hours.');
        }
        const updated = await tx.doctorSchedule.update({
          where: { id: scheduleId }, data: { startTime: dto.startTime, endTime: dto.endTime },
        });
        await tx.auditLog.create({ data: {
          hospitalId: current.doctor.hospitalId, branchId: current.doctor.branchId,
          userId: actor.id, userEmail: actor.email, userRole: actor.role, action: 'UPDATE_SCHEDULE',
          resource: 'DOCTOR_SCHEDULE', resourceId: scheduleId,
        } });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Bookings or working hours changed concurrently. Refresh and retry.');
      }
      throw error;
    }
  }

  async updateSchedule(
    actor: AuthUserDto,
    id: string,
    dto: { availableDays?: string[]; shift?: string; isAvailableToday?: boolean }
  ) {
    const doctor = await this.findOne(id, actor);
    assertBranchAccess(actor, doctor.branchId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.doctor.update({
        where: { id, hospitalId: doctor.hospitalId, branchId: doctor.branchId, departmentId: doctor.departmentId },
        data: {
          ...(dto.availableDays ? { availableDays: dto.availableDays } : {}),
          ...(dto.shift ? { shift: dto.shift } : {}),
          ...(dto.isAvailableToday !== undefined ? { isAvailableToday: dto.isAvailableToday } : {}),
        },
        include: {
          department: true,
          employee: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, isActive: true } } } },
        },
      });
      await tx.auditLog.create({ data: {
        hospitalId: doctor.hospitalId, branchId: doctor.branchId, userId: actor.id, userEmail: actor.email,
        userRole: actor.role, action: 'UPDATE_SCHEDULE', resource: 'DOCTOR', resourceId: id,
      } });
      return updated;
    });
  }

  async patientHistory(actor: AuthUserDto, patientId: string) {
    const { id: doctorId, hospitalId, branchId } = this.selfScope(actor);
    const context = { hospitalId, branchId, patientId };
    const owned = { ...context, doctorId };
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, hospitalId, deletedAt: null, OR: [
        { appointments: { some: { hospitalId, branchId, doctorId, status: { notIn: ['CANCELLED', 'NO_SHOW'] } } } },
        { admissions: { some: { hospitalId, branchId, admittingDoctorId: doctorId } } },
      ] },
      select: { id: true, uhid: true, firstName: true, lastName: true, dateOfBirth: true,
        gender: true, bloodGroup: true, allergies: true, medicalHistoryNotes: true },
    });
    if (!patient) throw new NotFoundException('Patient not found in your assignments.');
    const view = <T,>(permission: string, read: () => Promise<T[]>) => actor.permissions.includes(permission) ? read() : Promise.resolve([]);
    const [consultations, prescriptions, labs, radiology, vitals, admissions, followUps] = await Promise.all([
      view('CONSULTATIONS:VIEW', () => this.prisma.consultation.findMany({
        where: { ...owned, status: 'COMPLETED' }, take: 25, orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, chiefComplaint: true, diagnosisNotes: true, treatmentPlan: true },
      })),
      view('PRESCRIPTIONS:VIEW', () => this.prisma.prescription.findMany({
        where: owned, take: 25, orderBy: { createdAt: 'desc' },
        select: { id: true, prescriptionNumber: true, createdAt: true, dispensingStatus: true, notes: true,
          items: { select: { dosage: true, frequency: true, route: true, durationDays: true, instructions: true,
            medicine: { select: { brandName: true, strength: true } } } } },
      })),
      view('LAB_RESULTS:VIEW', () => this.prisma.labOrder.findMany({
        where: { ...owned, reportReleasedAt: { not: null } }, take: 25, orderBy: { reportReleasedAt: 'desc' },
        select: { id: true, orderNumber: true, reportReleasedAt: true,
          results: { select: { measuredValue: true, unit: true, isAbnormal: true, parameter: { select: { parameterName: true } } } } },
      })),
      view('RADIOLOGY_REPORTS:VIEW', () => this.prisma.radiologyOrder.findMany({
        where: { ...owned, reportReleasedAt: { not: null } }, take: 25, orderBy: { reportReleasedAt: 'desc' },
        select: { id: true, reportReleasedAt: true, findings: true, impression: true, test: { select: { name: true } } },
      })),
      view('VITALS:VIEW', () => this.prisma.vitalsRecord.findMany({
        where: context, take: 25, orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, systolicBp: true, diastolicBp: true, pulseRate: true, oxygenSaturation: true },
      })),
      view('ADMISSIONS:VIEW', () => this.prisma.admission.findMany({
        where: { ...context, admittingDoctorId: doctorId }, take: 25, orderBy: { admittedAt: 'desc' },
        select: { id: true, admissionNumber: true, admittedAt: true, dischargedAt: true, dischargeSummary: true,
          status: true, ward: { select: { name: true } }, bed: { select: { bedNumber: true } } },
      })),
      view('APPOINTMENTS:VIEW', () => this.prisma.appointment.findMany({
        where: { ...owned, type: 'FOLLOW_UP' }, take: 25, orderBy: { appointmentDate: 'desc' },
        select: { id: true, appointmentDate: true, appointmentTime: true, status: true, reasonForVisit: true },
      })),
    ]);
    return { patient, consultations, prescriptions, labs, radiology, vitals, admissions, followUps };
  }

  async getInpatients(actor: AuthUserDto, requestedBranch?: string) {
    this.selfScope(actor);
    const { hospitalId, branchId, departmentId } = resolveOperationalScope(actor, requestedBranch);
    const rows = await this.prisma.admission.findMany({
      where: { hospitalId, branchId, admittingDoctorId: actor.doctorProfileId, status: 'ADMITTED',
        admittingDoctor: departmentId ? { departmentId } : undefined },
      orderBy: [{ admittedAt: 'desc' }, { id: 'asc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, gender: true,
          dateOfBirth: true, bloodGroup: true, allergies: true } },
        ward: { select: { name: true, code: true } },
        bed: { select: { bedNumber: true, type: true } },
        vitals: actor.permissions.includes('VITALS:VIEW') ? { take: 3, orderBy: { createdAt: 'desc' } } : false,
      },
    });
    if (rows.length === 0) return rows;
    const latestNotes = await this.prisma.auditLog.findMany({
      where: { hospitalId, branchId, action: 'DOCTOR_ROUND', resource: 'ADMISSION',
        resourceId: { in: rows.map((row) => row.id) } },
      distinct: ['resourceId'], orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { resourceId: true, details: true, createdAt: true },
    });
    const byAdmission = new Map(latestNotes.map((note) => [note.resourceId, note]));
    return rows.map((row) => {
      const note = byAdmission.get(row.id);
      const details = note?.details;
      const text = details && typeof details === 'object' && !Array.isArray(details) ? details.progressNote : null;
      return { ...row, latestProgressNote: typeof text === 'string' ? text : null, latestRoundAt: note?.createdAt ?? null };
    });
  }

  async recordProgressNote(dto: DoctorRoundNoteDto, actor: AuthUserDto) {
    this.selfScope(actor);
    const fields = [dto?.progressNote, dto?.diagnosisUpdate, dto?.treatmentPlanUpdate, dto?.followUpInstructions];
    if (typeof dto?.admissionId !== 'string' || !dto.admissionId.trim()
      || typeof dto.progressNote !== 'string' || !dto.progressNote.trim()
      || fields.some((value) => value !== undefined && (typeof value !== 'string' || value.length > 4000))) {
      throw new BadRequestException('Enter an admission and a progress note. Note fields may contain up to 4,000 characters.');
    }
    const { hospitalId, branchId, departmentId } = resolveOperationalScope(actor);
    return this.prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: { id: dto.admissionId, hospitalId, branchId, status: 'ADMITTED', admittingDoctorId: actor.doctorProfileId,
          admittingDoctor: departmentId ? { departmentId } : undefined },
        select: { id: true, branchId: true, patient: { select: { firstName: true, lastName: true } } },
      });
      if (!admission) throw new NotFoundException('Active inpatient admission not found.');
      const progressNote = dto.progressNote.trim();
      const event = await tx.auditLog.create({
        data: {
          hospitalId, branchId: admission.branchId, userId: actor.id, userEmail: actor.email, userRole: actor.role,
          action: 'DOCTOR_ROUND', resource: 'ADMISSION', resourceId: admission.id,
          details: {
            progressNote,
            diagnosisUpdate: dto.diagnosisUpdate?.trim() || null,
            treatmentPlanUpdate: dto.treatmentPlanUpdate?.trim() || null,
            followUpInstructions: dto.followUpInstructions?.trim() || null,
          },
        },
        select: { createdAt: true },
      });
      return { admissionId: admission.id, patientName: `${admission.patient.firstName} ${admission.patient.lastName}`,
        progressNote, recordedAt: event.createdAt.toISOString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async toggleDoctorStatus(actor: AuthUserDto, id: string, status?: string) {
    const doctor = await this.findOne(id, actor);

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
          userEmail: actor.email,
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
