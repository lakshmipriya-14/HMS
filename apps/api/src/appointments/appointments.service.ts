import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentSource,
  AuthUserDto,
  CreateAppointmentDto,
  DoctorSlotAvailabilityDto,
  Role,
} from '@multispeciality-hms/contracts';
import { resolveOperationalScope } from '../common/utils/operational-scope';

export function appointmentReadScope(actor: AuthUserDto, requestedBranchId?: string): Prisma.AppointmentWhereInput {
  const scope = resolveOperationalScope(actor, requestedBranchId);
  const where: Prisma.AppointmentWhereInput = { hospitalId: scope.hospitalId };
  if (actor.role === Role.SUPER_ADMIN) {
    if (scope.branchId) where.branchId = scope.branchId;
    if (scope.departmentId) where.departmentId = scope.departmentId;
    return where;
  }
  if (actor.role === Role.PATIENT && actor.patientProfileId) {
    return { ...where, patientId: actor.patientProfileId };
  }
  if (actor.role === Role.HOSPITAL_ADMIN) {
    where.branchId = scope.branchId;
    if (scope.departmentId) where.departmentId = scope.departmentId;
    return where;
  }
  if (actor.role === Role.DOCTOR) {
    if (!actor.doctorProfileId) throw new ForbiddenException('Missing doctor assignment.');
    return { ...where, branchId: scope.branchId, departmentId: scope.departmentId, doctorId: actor.doctorProfileId };
  }
  if (actor.role === Role.DEPARTMENT_ADMIN) {
    return { ...where, branchId: scope.branchId, departmentId: scope.departmentId };
  }
  return { ...where, branchId: scope.branchId, departmentId: scope.departmentId };
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private toMinutes(value: string): number {
    const [hours, mins] = value.split(':').map(Number);
    return hours * 60 + mins;
  }

  private fromMinutes(total: number): string {
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private async generateAppointmentNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `APT-${year}-`;
    const latest = await tx.appointment.findFirst({
      where: { appointmentNumber: { startsWith: prefix } },
      orderBy: { appointmentNumber: 'desc' },
      select: { appointmentNumber: true },
    });
    const lastSeq = latest?.appointmentNumber
      ? parseInt(latest.appointmentNumber.slice(prefix.length), 10) || 0
      : 0;
    const count = await tx.appointment.count();
    const sequence = Math.max(lastSeq, count) + 1;
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async getBookingOptions(actor: AuthUserDto, requestedBranchId?: string) {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const branchWhere: Prisma.BranchWhereInput = {
      hospitalId: scope.hospitalId,
      isActive: true,
      deletedAt: null,
      ...(scope.branchId ? { id: scope.branchId } : {}),
    };
    const deptWhere: Prisma.DepartmentWhereInput = {
      hospitalId: scope.hospitalId,
      isActive: true,
      deletedAt: null,
      ...(scope.branchId ? { branchId: scope.branchId } : {}),
      ...(scope.departmentId ? { id: scope.departmentId } : {}),
    };
    const doctorWhere: Prisma.DoctorWhereInput = {
      hospitalId: scope.hospitalId,
      ...(scope.branchId ? { branchId: scope.branchId } : {}),
      ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
      employee: { user: { isActive: true, deletedAt: null } },
    };

    const [branches, departments, doctors] = await Promise.all([
      this.prisma.branch.findMany({
        where: branchWhere,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          address: true,
          phone: true,
          hospital: { select: { id: true, name: true } },
        },
      }),
      this.prisma.department.findMany({
        where: deptWhere,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          branchId: true,
        },
      }),
      this.prisma.doctor.findMany({
        where: doctorWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          designation: true,
          specialization: true,
          consultationFee: true,
          consultationDurationMin: true,
          isAvailableToday: true,
          branchId: true,
          departmentId: true,
          branch: { select: { id: true, name: true, city: true, hospital: { select: { name: true } } } },
          department: { select: { id: true, name: true, code: true } },
          employee: { select: { user: { select: { firstName: true, lastName: true } } } },
          schedules: {
            where: { isActive: true },
            orderBy: { startTime: 'asc' },
            select: { id: true, dayOfWeek: true, startTime: true, endTime: true, maxPatients: true },
          },
        },
      }),
    ]);

    return {
      branches,
      departments,
      doctors: doctors.map((doc) => ({
        ...doc,
        consultationFee: Number(doc.consultationFee ?? 0),
      })),
    };
  }

  async getAvailableSlots(
    actor: AuthUserDto,
    doctorId: string,
    dateStr: string,
    requestedBranchId?: string,
  ): Promise<DoctorSlotAvailabilityDto> {
    if (!doctorId || !dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Doctor ID and a valid YYYY-MM-DD date are required.');
    }
    const appointmentDate = new Date(dateStr + 'T00:00:00Z');
    if (!Number.isFinite(appointmentDate.getTime()) || appointmentDate.toISOString().slice(0, 10) !== dateStr) {
      throw new BadRequestException('Invalid appointment date.');
    }

    const scope = resolveOperationalScope(actor, requestedBranchId);
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        id: doctorId,
        hospitalId: scope.hospitalId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        employee: { user: { isActive: true, deletedAt: null } },
      },
      select: { id: true, branchId: true, consultationDurationMin: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found in this branch.');

    const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' })
      .format(appointmentDate)
      .toUpperCase();

    const [schedules, leave, bookings] = await Promise.all([
      this.prisma.doctorSchedule.findMany({
        where: { doctorId: doctor.id, dayOfWeek, isActive: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.doctorLeave.findFirst({
        where: {
          doctorId: doctor.id,
          isApproved: true,
          startDate: { lte: appointmentDate },
          endDate: { gte: appointmentDate },
        },
        select: { id: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          appointmentDate,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { appointmentTime: true },
      }),
    ]);

    const duration = Math.max(10, doctor.consultationDurationMin || 15);
    const nowMs = Date.now();
    const bookedMinutes = bookings.map((b) => this.toMinutes(b.appointmentTime));
    const slots: DoctorSlotAvailabilityDto['slots'] = [];
    const seen = new Set<string>();

    for (const window of schedules) {
      const winStart = this.toMinutes(window.startTime);
      const winEnd = this.toMinutes(window.endTime);
      const activeInWindow = bookings.filter(
        (b) => b.appointmentTime >= window.startTime && b.appointmentTime < window.endTime,
      ).length;
      const windowFull = activeInWindow >= window.maxPatients;

      for (let m = winStart; m + duration <= winEnd; m += duration) {
        const time = this.fromMinutes(m);
        if (seen.has(time)) continue;
        seen.add(time);
        const endTime = this.fromMinutes(m + duration);
        const isPast = new Date(`${dateStr}T${time}:00+05:30`).getTime() <= nowMs;
        const overlapsBooking = bookedMinutes.some((bm) => Math.abs(bm - m) < duration);

        let reason: DoctorSlotAvailabilityDto['slots'][number]['reason'];
        if (leave) reason = 'ON_LEAVE';
        else if (overlapsBooking) reason = 'BOOKED';
        else if (windowFull) reason = 'CAPACITY_FULL';
        else if (isPast) reason = 'PAST_TIME';

        slots.push({
          time,
          endTime,
          available: !reason,
          ...(reason ? { reason } : {}),
        });
      }
    }

    return {
      doctorId: doctor.id,
      branchId: doctor.branchId,
      date: dateStr,
      dayOfWeek,
      isOnLeave: !!leave,
      consultationDurationMin: duration,
      slots,
    };
  }

  async create(dto: CreateAppointmentDto, actor: AuthUserDto) {
    if (actor.role === Role.PATIENT) throw new ForbiddenException('Send an appointment request to Reception.');

    const scope = resolveOperationalScope(actor, dto.branchId, dto.departmentId);
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId, ...scope, employee: { user: { isActive: true, deletedAt: null } } },
      include: { employee: { select: { userId: true } } },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (dto.requestId && (actor.role !== Role.RECEPTIONIST ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.requestId))) {
      throw new BadRequestException('Invalid Reception appointment request.');
    }
    const requestScope = { id: dto.requestId, hospitalId: doctor.hospitalId, branchId: doctor.branchId,
      patientId: dto.patientId, status: 'PATIENT_LINKED' as const };
    if (dto.requestId && !await this.prisma.appointmentRequest.findFirst({ where: requestScope, select: { id: true } })) {
      throw new NotFoundException('Pending appointment request not found in this branch.');
    }
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, hospitalId: scope.hospitalId, deletedAt: null },
      select: { id: true, userId: true, firstName: true, lastName: true, uhid: true },
    });
    if (!patient) throw new NotFoundException('Patient not found in this hospital.');

    const appointmentDate = new Date(dto.appointmentDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.appointmentDate)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.appointmentTime)
      || !Number.isFinite(appointmentDate.getTime()) || appointmentDate.toISOString().slice(0, 10) !== dto.appointmentDate) {
      throw new BadRequestException('Choose a valid appointment date (YYYY-MM-DD) and time (HH:mm).');
    }

    const isEmergency = dto.priority === 'STAT_EMERGENCY' || dto.appointmentType === 'EMERGENCY';
    if (!isEmergency && new Date(dto.appointmentDate + 'T' + dto.appointmentTime + ':00+05:30').getTime() <= Date.now()) {
      throw new BadRequestException('Choose a future appointment date and time.');
    }

    const source: AppointmentSource = dto.requestId
      ? AppointmentSource.ONLINE_PATIENT
      : AppointmentSource.RECEPTION_WALK_IN;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const booked = await tx.appointment.findMany({
          where: { doctorId: dto.doctorId, appointmentDate },
          select: { patientId: true, appointmentTime: true, tokenNumber: true, status: true },
        });
        const active = booked.filter(({ status }) => !['CANCELLED', 'NO_SHOW'].includes(status));
        if (active.some(({ appointmentTime }) => appointmentTime === dto.appointmentTime)) {
          throw new ConflictException('This time slot is already booked.');
        }
        if (active.some((row) => row.patientId === dto.patientId && row.appointmentTime === dto.appointmentTime)) {
          throw new ConflictException('This patient already has an active appointment at this time.');
        }

        if (!isEmergency) {
          const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(appointmentDate).toUpperCase();
          const [schedules, leave] = await Promise.all([
            tx.doctorSchedule.findMany({ where: { doctorId: dto.doctorId, dayOfWeek, isActive: true } }),
            tx.doctorLeave.findFirst({ where: { doctorId: dto.doctorId, isApproved: true,
              startDate: { lte: appointmentDate }, endDate: { gte: appointmentDate } } }),
          ]);
          const start = this.toMinutes(dto.appointmentTime);
          const duration = doctor.consultationDurationMin || 15;
          const window = schedules.find((slot) =>
            this.toMinutes(slot.startTime) <= start && start + duration <= this.toMinutes(slot.endTime));
          if (leave || !window) {
            throw new ConflictException('The doctor is unavailable at that time.');
          }
          if (active.some(({ appointmentTime }) => Math.abs(this.toMinutes(appointmentTime) - start) < duration)
            || active.filter(({ appointmentTime }) => appointmentTime >= window.startTime && appointmentTime < window.endTime).length >= window.maxPatients) {
            throw new ConflictException('This slot overlaps an existing booking or has reached capacity.');
          }
        }

        const tokenNumber = booked.reduce((max, row) => Math.max(max, row.tokenNumber), 0) + 1;
        const appointmentNumber = await this.generateAppointmentNumber(tx);
        const appointment = await tx.appointment.create({
          data: {
            appointmentNumber,
            patientId: dto.patientId,
            doctorId: dto.doctorId,
            departmentId: doctor.departmentId,
            appointmentDate,
            appointmentTime: dto.appointmentTime,
            tokenNumber,
            type: dto.appointmentType || 'OPD',
            source,
            priority: dto.priority || 'ROUTINE',
            reasonForVisit: dto.reasonForVisit?.trim() || 'OPD Consultation',
            consultationFee: doctor.consultationFee,
            status: 'SCHEDULED',
            isPaid: false,
            hospitalId: doctor.hospitalId,
            branchId: doctor.branchId,
          },
          include: {
            patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                phone: true,
                hospital: { select: { id: true, name: true } },
              },
            },
            doctor: {
              include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                department: { select: { id: true, name: true, code: true } },
              },
            },
          },
        });

        if (dto.requestId) {
          const linked = await tx.appointmentRequest.updateMany({
            where: requestScope, data: { status: 'BOOKED', appointmentId: appointment.id },
          });
          if (linked.count !== 1) throw new ConflictException('This request has already been booked. Refresh and try again.');
        }

        const sourceLabel = source === AppointmentSource.RECEPTION_WALK_IN
          ? 'Receptionist / Walk-in Booking'
          : 'Online Patient Booking';
        await tx.notification.create({
          data: {
            hospitalId: appointment.hospitalId,
            branchId: appointment.branchId,
            userId: doctor.employee.userId,
            title: `New ${source === AppointmentSource.RECEPTION_WALK_IN ? 'Walk-in ' : ''}Patient Appointment`,
            message: `${appointment.patient.firstName} ${appointment.patient.lastName} (${appointment.patient.uhid}) booked ${dto.appointmentDate} at ${dto.appointmentTime} IST · Token #${appointment.tokenNumber} (${appointment.appointmentNumber}) [${sourceLabel}].`,
            type: 'APPOINTMENT',
          },
        });

        if (patient.userId) {
          const docName = appointment.doctor?.employee?.user
            ? `Dr. ${appointment.doctor.employee.user.firstName} ${appointment.doctor.employee.user.lastName}`
            : 'your doctor';
          await tx.notification.create({
            data: {
              hospitalId: appointment.hospitalId,
              branchId: appointment.branchId,
              userId: patient.userId,
              title: 'Appointment Confirmed',
              message: `Your appointment (${appointment.appointmentNumber}) with ${docName} (${appointment.department.name}) at ${appointment.branch.name} on ${dto.appointmentDate} at ${dto.appointmentTime} IST is confirmed. Token #${appointment.tokenNumber}.`,
              type: 'APPOINTMENT',
            },
          });
        }

        return appointment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) {
        throw new ConflictException('Another booking changed availability. Refresh before trying again.');
      }
      throw error;
    }
  }

  async startConsultation(id: string, actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR) throw new ForbiddenException('Only the assigned doctor can start a consultation.');
    const where = { ...appointmentReadScope(actor), id };
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({ where });
      if (!appointment) throw new NotFoundException('Appointment not found.');
      if (appointment.status === 'IN_PROGRESS') return { id, status: appointment.status };
      const updated = await tx.appointment.updateMany({ where: { ...where, status: 'CHECKED_IN' }, data: { status: 'IN_PROGRESS' } });
      if (!updated.count) throw new ConflictException('Check in the patient before starting a consultation.');
      await tx.auditLog.create({ data: {
        hospitalId: appointment.hospitalId, branchId: appointment.branchId, userId: actor.id,
        userEmail: actor.email, userRole: actor.role, action: 'UPDATE', resource: 'APPOINTMENT', resourceId: id,
        details: { status: 'IN_PROGRESS' },
      } });
      return { id, status: 'IN_PROGRESS' };
    });
  }

  async getTodayQueue(actor: AuthUserDto, doctorId?: string, requestedBranchId?: string) {
    const calendarDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
    const today = new Date(calendarDay + 'T00:00:00Z');

    const where: Prisma.AppointmentWhereInput = {
      appointmentDate: today,
      AND: [appointmentReadScope(actor, requestedBranchId), ...(doctorId ? [{ doctorId }] : [])],
    };

    return this.prisma.appointment.findMany({
      where,
      orderBy: { tokenNumber: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            hospital: { select: { id: true, name: true } },
          },
        },
        patient: {
          select: {
            id: true,
            uhid: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            phone: true,
            email: true,
            allergies: true,
          },
        },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        consultation: {
          select: { id: true, status: true },
        },
      },
    });
  }

  async checkIn(id: string, actor: AuthUserDto) {
    if (actor.role === Role.PATIENT) throw new ForbiddenException('Check-in is handled at Reception.');
    const scope = appointmentReadScope(actor);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({ where: { ...scope, id } });
      if (!appointment) throw new NotFoundException('Appointment not found');
      if (appointment.status === 'CHECKED_IN') return appointment;
      const updated = await tx.appointment.updateMany({
        where: { id, ...scope, status: 'SCHEDULED', appointmentDate: new Date(today + 'T00:00:00Z') },
        data: { status: 'CHECKED_IN', checkInAt: new Date() },
      });
      if (!updated.count) throw new ConflictException('Only today’s scheduled appointments can be checked in.');
      return tx.appointment.findUniqueOrThrow({ where: { id } });
    });
  }

  async reschedule(id: string, newDate: string, newTime: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const appointmentDate = new Date(newDate);

    // Conflict check
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate,
        appointmentTime: newTime,
        id: { not: id },
        status: { not: 'CANCELLED' },
      },
    });
    if (conflict) {
      throw new BadRequestException('The requested slot is already booked for this doctor. Please choose a different time.');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate,
        appointmentTime: newTime,
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  async cancel(id: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        reasonForVisit: reason ? `${appointment.reasonForVisit || ''} [Cancelled: ${reason}]` : appointment.reasonForVisit,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const data: any = { status };
    if (status === 'CHECKED_IN' && !appointment.checkInAt) {
      data.checkInAt = new Date();
    } else if (status === 'COMPLETED' && !appointment.completedAt) {
      data.completedAt = new Date();
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { appointmentDate: 'desc' },
      include: {
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: { select: { name: true } },
          },
        },
        consultation: true,
      },
    });
  }

  async findAll(
    actor: AuthUserDto,
    params?: {
      date?: string;
      departmentId?: string;
      doctorId?: string;
      status?: string;
      search?: string;
      requestedBranchId?: string;
    }
  ) {
    const scope = appointmentReadScope(actor, params?.requestedBranchId);
    const andClauses: Prisma.AppointmentWhereInput[] = [scope];

    if (params?.date) {
      const d = new Date(params.date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      andClauses.push({
        appointmentDate: { gte: d, lt: nextDay },
      });
    }

    if (params?.departmentId) {
      andClauses.push({ departmentId: params.departmentId });
    }

    if (params?.doctorId) {
      andClauses.push({ doctorId: params.doctorId });
    }

    if (params?.status) {
      andClauses.push({ status: params.status });
    }

    if (params?.search) {
      andClauses.push({
        OR: [
          { appointmentNumber: { contains: params.search, mode: 'insensitive' } },
          { patient: { firstName: { contains: params.search, mode: 'insensitive' } } },
          { patient: { lastName: { contains: params.search, mode: 'insensitive' } } },
          { patient: { uhid: { contains: params.search, mode: 'insensitive' } } },
          { patient: { phone: { contains: params.search, mode: 'insensitive' } } },
        ],
      });
    }

    return this.prisma.appointment.findMany({
      where: { AND: andClauses },
      orderBy: [{ appointmentDate: 'desc' }, { tokenNumber: 'asc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true, email: true, gender: true, dateOfBirth: true } },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            hospital: { select: { id: true, name: true } },
          },
        },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
      },
      take: 100,
    });
  }
}
