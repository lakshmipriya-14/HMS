import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appointmentReadScope } from '../appointments/appointments.service';
import { AuthUserDto, CreateConsultationDto, Role } from '@multispeciality-hms/contracts';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConsultationDto, actor: AuthUserDto) {
    return this.save(dto, actor, false);
  }

  async saveDraft(dto: CreateConsultationDto, actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR) throw new ForbiddenException('Only the assigned doctor can save drafts.');
    return this.save(dto, actor, true);
  }

  private async save(dto: CreateConsultationDto, actor: AuthUserDto, draft: boolean) {
    if (!dto || typeof dto.appointmentId !== 'string' || !dto.appointmentId.trim()
      || ![dto.chiefComplaint, dto.diagnosisNotes, dto.treatmentPlan].every(
        (value) => typeof value === 'string' && value.length <= 8000 && (draft || value.trim().length > 0),
      )) {
      throw new BadRequestException('Appointment, chief complaint, diagnosis and treatment plan are required.');
    }
    const followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    if (followUpDate && (!Number.isFinite(followUpDate.getTime())
      || followUpDate.toISOString().slice(0, 10) !== dto.followUpDate)) {
      throw new BadRequestException('Follow-up date must be a valid YYYY-MM-DD date.');
    }
    const scope = appointmentReadScope(actor);
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({ where: { ...scope, id: dto.appointmentId } });
      if (!appointment) throw new NotFoundException('Appointment not found.');
      if ((dto.patientId && dto.patientId !== appointment.patientId)
        || (dto.doctorId && dto.doctorId !== appointment.doctorId)) {
        throw new BadRequestException('Patient and doctor must match the appointment.');
      }
      const updated = await tx.appointment.updateMany({
        where: { ...scope, id: appointment.id, status: { in: draft ? ['IN_PROGRESS'] : ['CHECKED_IN', 'IN_PROGRESS'] } },
        data: draft ? { status: 'IN_PROGRESS' } : { status: 'COMPLETED', completedAt: new Date() },
      });
      if (!updated.count) throw new ConflictException('Only checked-in or in-progress appointments can be completed.');
      const existing = await tx.consultation.findUnique({ where: { appointmentId: appointment.id }, select: { id: true, status: true } });
      if (existing && existing.status !== 'DRAFT') {
        throw new ConflictException('This consultation was already finalized. Add an amendment instead.');
      }
      const data = {
          appointmentId: appointment.id, patientId: appointment.patientId, doctorId: appointment.doctorId,
          hospitalId: appointment.hospitalId, branchId: appointment.branchId,
          chiefComplaint: dto.chiefComplaint.trim(), historyOfPresentIllness: dto.historyOfPresentIllness,
          physicalExamNotes: dto.physicalExaminationNotes, diagnosisNotes: dto.diagnosisNotes.trim(),
          icd10Codes: dto.icd10Codes ?? [], treatmentPlan: dto.treatmentPlan.trim(), followUpDate,
          admissionRecommended: dto.admissionRecommended ?? false, status: draft ? 'DRAFT' : 'COMPLETED',
      };
      const consultation = existing
        ? await tx.consultation.update({ where: { id: existing.id }, data })
        : await tx.consultation.create({ data });
      await tx.auditLog.create({ data: {
        hospitalId: appointment.hospitalId, branchId: appointment.branchId,
        userId: actor.id, userEmail: actor.email, userRole: actor.role,
        action: draft ? 'SAVE_DRAFT' : 'FINALIZE', resource: 'CONSULTATION', resourceId: consultation.id,
      } });
      return consultation;
    });
  }

  async draft(appointmentId: string, actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR) throw new ForbiddenException('Only the assigned doctor can read drafts.');
    return this.prisma.consultation.findFirst({
      where: { appointmentId, status: 'DRAFT', appointment: appointmentReadScope(actor) },
    });
  }

  async amend(id: string, reason: unknown, note: unknown, actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR) throw new ForbiddenException('Only the assigned doctor can amend consultations.');
    if (typeof reason !== 'string' || typeof note !== 'string' || !reason.trim() || !note.trim()
      || reason.length > 500 || note.length > 8000) {
      throw new BadRequestException('Enter an amendment reason and note.');
    }
    return this.prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findFirst({
        where: { id, status: 'COMPLETED', appointment: appointmentReadScope(actor) },
        select: { id: true, hospitalId: true, branchId: true },
      });
      if (!consultation) throw new NotFoundException('Finalized consultation not found.');
      const amendment = await tx.consultationAmendment.create({ data: {
        consultationId: id, hospitalId: consultation.hospitalId, branchId: consultation.branchId,
        authorId: actor.id, reason: reason.trim(), note: note.trim(),
      } });
      await tx.auditLog.create({ data: {
        hospitalId: consultation.hospitalId, branchId: consultation.branchId, userId: actor.id, userEmail: actor.email,
        userRole: actor.role, action: 'AMEND', resource: 'CONSULTATION', resourceId: consultation.id,
        details: { amendmentId: amendment.id },
      } });
      return amendment;
    });
  }

  async scheduleFollowUp(id: string, date: unknown, time: unknown, instructions: unknown, actor: AuthUserDto) {
    if (actor.role !== Role.DOCTOR) throw new ForbiddenException('Only the assigned doctor can schedule a follow-up.');
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
      || typeof instructions !== 'string' || !instructions.trim() || instructions.length > 2000) {
      throw new BadRequestException('Enter a date, time and follow-up instructions.');
    }
    const appointmentDate = new Date(date + 'T00:00:00Z');
    const startsAt = new Date(date + 'T' + time + ':00+05:30');
    if (!Number.isFinite(appointmentDate.getTime()) || appointmentDate.toISOString().slice(0, 10) !== date
      || startsAt.getTime() <= Date.now()) throw new BadRequestException('Choose a valid future appointment date and time.');
    const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(appointmentDate).toUpperCase();
    const minutes = (slot: string) => {
      const [hour, minute] = slot.split(':').map(Number);
      return hour * 60 + minute;
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const source = await tx.consultation.findFirst({
          where: { id, status: 'COMPLETED', appointment: appointmentReadScope(actor) },
          select: { hospitalId: true, branchId: true, patientId: true, doctorId: true,
            appointment: { select: { departmentId: true } },
            doctor: { select: { followUpFee: true, consultationDurationMin: true,
              schedules: { where: { dayOfWeek, isActive: true }, select: { startTime: true, endTime: true, maxPatients: true } },
              leaves: { where: { isApproved: true, startDate: { lte: appointmentDate }, endDate: { gte: appointmentDate } }, select: { id: true } },
            } },
          },
        });
        if (!source) throw new NotFoundException('Finalized consultation not found.');
        const duration = source.doctor.consultationDurationMin;
        const slot = source.doctor.schedules.find((window) =>
          minutes(window.startTime) <= minutes(time) && minutes(time) + duration <= minutes(window.endTime));
        if (!slot || source.doctor.leaves.length) throw new ConflictException('The doctor is unavailable at that time.');
        const scope = { hospitalId: source.hospitalId, branchId: source.branchId, doctorId: source.doctorId };
        const booked = await tx.appointment.findMany({ where: { ...scope, appointmentDate },
          select: { appointmentTime: true, tokenNumber: true, status: true } });
        const active = booked.filter(({ status }) => !['CANCELLED', 'NO_SHOW'].includes(status));
        if (active.some(({ appointmentTime }) => Math.abs(minutes(appointmentTime) - minutes(time)) < duration)
          || active.filter(({ appointmentTime }) => appointmentTime >= slot.startTime && appointmentTime < slot.endTime).length >= slot.maxPatients) {
          throw new ConflictException('This slot overlaps an appointment or has reached capacity.');
        }
        const appointment = await tx.appointment.create({ data: {
          ...scope, sourceConsultationId: id, patientId: source.patientId, departmentId: source.appointment.departmentId,
          appointmentNumber: 'FU-' + randomUUID(), appointmentDate, appointmentTime: time,
          tokenNumber: booked.reduce((max, row) => Math.max(max, row.tokenNumber), 0) + 1,
          type: 'FOLLOW_UP', reasonForVisit: instructions.trim(), consultationFee: source.doctor.followUpFee,
        } });
        await tx.auditLog.create({ data: {
          hospitalId: source.hospitalId, branchId: source.branchId, userId: actor.id, userEmail: actor.email, userRole: actor.role,
          action: 'CREATE', resource: 'APPOINTMENT', resourceId: appointment.id, details: { sourceConsultationId: id },
        } });
        return appointment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) {
        throw new ConflictException('The slot changed. Refresh and try again.');
      }
      throw error;
    }
  }

  async forAppointment(appointmentId: string, actor: AuthUserDto) {
    return this.prisma.consultation.findFirst({
      where: { appointmentId, status: 'COMPLETED', appointment: appointmentReadScope(actor) },
      include: { amendments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
    });
  }

  async findByPatient(patientId: string, actor: AuthUserDto) {
    return this.prisma.consultation.findMany({
      where: { patientId, status: 'COMPLETED', appointment: appointmentReadScope(actor) },
      orderBy: { createdAt: 'desc' },
      include: {
        amendments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, reason: true, note: true, createdAt: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: { select: { name: true } },
          },
        },
        prescriptions: {
          include: { items: { include: { medicine: true } } },
        },
      },
    });
  }

  async findOne(id: string, actor: AuthUserDto) {
    const consultation = await this.prisma.consultation.findFirst({
      where: { id, status: 'COMPLETED', appointment: appointmentReadScope(actor) },
      include: {
        amendments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, reason: true, note: true, createdAt: true } },
        patient: true,
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            department: true,
          },
        },
        prescriptions: {
          include: { items: { include: { medicine: true } } },
        },
      },
    });
    if (!consultation) throw new NotFoundException('Consultation record not found');
    return consultation;
  }
}
