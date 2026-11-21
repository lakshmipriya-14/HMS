import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, CreateAppointmentDto, Role } from '@multispeciality-hms/contracts';

export function appointmentReadScope(actor: AuthUserDto): Prisma.AppointmentWhereInput {
  if (!actor.hospitalId) throw new ForbiddenException('Missing hospital scope.');
  const scope = { hospitalId: actor.hospitalId };
  if (actor.role === Role.SUPER_ADMIN || actor.role === Role.HOSPITAL_ADMIN) return scope;
  if (actor.role === Role.PATIENT && actor.patientProfileId) return { ...scope, patientId: actor.patientProfileId };
  if (!actor.branchId) throw new ForbiddenException('Missing branch scope.');
  if (actor.role === Role.DOCTOR && !actor.doctorProfileId) throw new ForbiddenException('Missing doctor assignment.');
  if (actor.role === Role.DEPARTMENT_ADMIN && !actor.departmentId) throw new ForbiddenException('Missing department assignment.');
  return { ...scope, branchId: actor.branchId, departmentId: actor.departmentId,
    doctorId: actor.role === Role.DOCTOR ? actor.doctorProfileId : undefined };
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

  async getTodayQueue(actor: AuthUserDto, doctorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.AppointmentWhereInput = {
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
      AND: [appointmentReadScope(actor), ...(doctorId ? [{ doctorId }] : [])],
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
}
