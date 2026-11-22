import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
}
