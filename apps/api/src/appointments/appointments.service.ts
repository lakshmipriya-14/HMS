import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, CreateAppointmentDto, Role } from '@multispeciality-hms/contracts';
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

  private async generateAppointmentNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.appointment.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `APT-${year}-${sequence}`;
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
      where: { id: dto.patientId, hospitalId: scope.hospitalId, deletedAt: null,
        ...(!dto.requestId && { OR: [{ registrationBranchId: doctor.branchId }, { appointments: { some: { branchId: doctor.branchId } } },
          { admissions: { some: { branchId: doctor.branchId } } }] }) },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException('Patient not found in the selected branch');

    const appointmentDate = new Date(dto.appointmentDate);
    if (dto.requestId && (!/^\d{4}-\d{2}-\d{2}$/.test(dto.appointmentDate)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.appointmentTime)
      || !Number.isFinite(appointmentDate.getTime()) || appointmentDate.toISOString().slice(0, 10) !== dto.appointmentDate
      || new Date(dto.appointmentDate + 'T' + dto.appointmentTime + ':00+05:30').getTime() <= Date.now())) {
      throw new BadRequestException('Choose a valid future appointment date and time.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const booked = await tx.appointment.findMany({
          where: { doctorId: dto.doctorId, appointmentDate },
          select: { appointmentTime: true, tokenNumber: true, status: true },
        });
        const active = booked.filter(({ status }) => status !== 'CANCELLED');
        if (active.some(({ appointmentTime }) => appointmentTime === dto.appointmentTime)) {
          throw new ConflictException('This time slot is already booked.');
        }
        if (dto.requestId) {
          const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(appointmentDate).toUpperCase();
          const [schedules, leave] = await Promise.all([
            tx.doctorSchedule.findMany({ where: { doctorId: dto.doctorId, dayOfWeek, isActive: true } }),
            tx.doctorLeave.findFirst({ where: { doctorId: dto.doctorId, isApproved: true,
              startDate: { lte: appointmentDate }, endDate: { gte: appointmentDate } } }),
          ]);
          const minutes = (value: string) => {
            const [hours, mins] = value.split(':').map(Number);
            return hours * 60 + mins;
          };
          const start = minutes(dto.appointmentTime);
          const duration = doctor.consultationDurationMin;
          const window = schedules.find((slot) =>
            minutes(slot.startTime) <= start && start + duration <= minutes(slot.endTime));
          if (leave || !window) throw new ConflictException('The doctor is unavailable at that time.');
          if (active.some(({ appointmentTime }) => Math.abs(minutes(appointmentTime) - start) < duration)
            || active.filter(({ appointmentTime }) => appointmentTime >= window.startTime && appointmentTime < window.endTime).length >= window.maxPatients) {
            throw new ConflictException('This slot overlaps an appointment or has reached capacity.');
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
            type: dto.appointmentType,
            priority: dto.priority || 'ROUTINE',
            reasonForVisit: dto.reasonForVisit,
            consultationFee: doctor.consultationFee,
            status: 'SCHEDULED',
            isPaid: false,
            hospitalId: doctor.hospitalId,
            branchId: doctor.branchId,
          },
          include: {
            patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
            doctor: {
              include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
                department: { select: { name: true } },
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
        await tx.notification.create({ data: {
          hospitalId: appointment.hospitalId, branchId: appointment.branchId, userId: doctor.employee.userId,
          title: 'New patient appointment',
          message: `${appointment.patient.firstName} ${appointment.patient.lastName} has an appointment (${appointment.appointmentNumber}).`,
          type: 'APPOINTMENT',
        } });
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
        department: { select: { name: true } },
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
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
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
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true, gender: true, dateOfBirth: true } },
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
