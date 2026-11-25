import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  private async generateAppointmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.appointment.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `APT-${year}-${sequence}`;
  }

  async create(dto: CreateAppointmentDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const appointmentDate = new Date(dto.appointmentDate);

    // Check slot conflict for the same doctor, date, and time
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        appointmentDate,
        appointmentTime: dto.appointmentTime,
        status: { not: 'CANCELLED' },
      },
    });
    if (conflict) {
      throw new BadRequestException('This time slot is already booked for this doctor. Please select another time slot.');
    }

    // Get today's token count for this doctor
    const existingCount = await this.prisma.appointment.count({
      where: {
        doctorId: dto.doctorId,
        appointmentDate,
      },
    });
    const tokenNumber = existingCount + 1;

    const appointmentNumber = await this.generateAppointmentNumber();

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        departmentId: dto.departmentId,
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

    return appointment;
  }

  async getTodayQueue(actor: AuthUserDto, doctorId?: string, requestedBranchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.AppointmentWhereInput = {
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
      AND: [appointmentReadScope(actor, requestedBranchId), ...(doctorId ? [{ doctorId }] : [])],
    };

    return this.prisma.appointment.findMany({
      where,
      orderBy: { tokenNumber: 'asc' },
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

  async checkIn(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkInAt: new Date(),
      },
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
