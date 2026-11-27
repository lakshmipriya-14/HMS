import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto, AuthUserDto, Role, parseAppointmentPreferredDate } from '@multispeciality-hms/contracts';
import { randomToken, tokenDigest } from '../auth/auth.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  private async ownPatient(actor: AuthUserDto) {
    if (actor.role !== Role.PATIENT || !actor.patientProfileId) throw new ForbiddenException('Patient account required.');
    const row = await this.prisma.patient.findFirst({
      where: { id: actor.patientProfileId, hospitalId: actor.hospitalId, userId: actor.id, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, uhid: true, phone: true, email: true,
        dateOfBirth: true, gender: true, bloodGroup: true, addressLine1: true, addressLine2: true,
        city: true, state: true, postalCode: true, country: true,
        emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
        allergies: true, medicalHistoryNotes: true,
        user: { select: { avatarUrl: true, email: true } }, registrationBranchId: true, hospital: { select: { name: true } },
        registrationBranch: { select: { name: true, phone: true, address: true, city: true } },
      },
    });
    if (!row) throw new NotFoundException('Patient profile not found.');
    return row;
  }

  async updatePhoto(actor: AuthUserDto, value: unknown) {
    await this.ownPatient(actor);
    if (typeof value !== 'string' || value.length > 96_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new BadRequestException('Choose a JPEG photo under 70 KB.');
    }
    const bytes = Buffer.from(value.slice('data:image/jpeg;base64,'.length), 'base64');
    if (bytes.length < 4 || bytes.length > 70 * 1024 || bytes[0] !== 255 || bytes[1] !== 216
      || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw new BadRequestException('Invalid JPEG photo.');
    return this.prisma.user.update({ where: { id: actor.id, hospitalId: actor.hospitalId, deletedAt: null },
      data: { avatarUrl: value }, select: { avatarUrl: true } });
  }

  async changeAppointment(actor: AuthUserDto, id: string, body: { action?: string; date?: string; time?: string; reason?: string }) {
    const patient = actor.role === Role.PATIENT ? await this.ownPatient(actor) : null;
    if (!patient && (actor.role !== Role.RECEPTIONIST || !actor.branchId)) throw new ForbiddenException('Reception branch required.');
    const scope = patient ? { patientId: patient.id } : { branchId: actor.branchId };
    const cancel = body?.action === 'cancel';
    const cleanReason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 300) : '';
    if (!cancel && (body?.action !== 'reschedule' || typeof body.date !== 'string' || typeof body.time !== 'string'
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time))) throw new BadRequestException('Choose a valid date and time.');
    const minutes = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.appointment.findFirst({
          where: { id, ...scope, hospitalId: actor.hospitalId },
          include: {
            patient: { select: { id: true, userId: true, firstName: true, lastName: true, uhid: true } },
            department: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
            doctor: { include: { employee: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } } } },
          },
        });
        if (!row) throw new NotFoundException('Appointment not found.');
        if (row.status === 'CANCELLED' && cancel) return { id, status: row.status };
        const startsAt = Date.parse(row.appointmentDate.toISOString().slice(0, 10) + 'T' + row.appointmentTime + ':00+05:30');
        if (cancel) {
          if (['COMPLETED', 'IN_PROGRESS', 'NO_SHOW'].includes(row.status)) {
            throw new ConflictException('Consultation is already in progress or completed. Contact Reception.');
          }
        } else if (row.status !== 'SCHEDULED' || !Number.isFinite(startsAt) || startsAt <= Date.now()) {
          throw new ConflictException('Contact Reception to change this appointment.');
        }
        const update: Prisma.AppointmentUpdateInput = cancel ? { status: 'CANCELLED' } : {};
        if (!cancel) {
          let date: Date;
          try { date = parseAppointmentPreferredDate(body.date!, new Date()); }
          catch { throw new BadRequestException('Choose a valid date within the next 90 days.'); }
          if (Date.parse(body.date + 'T' + body.time + ':00+05:30') <= Date.now()) throw new BadRequestException('Choose a future time.');
          if (date.getTime() === row.appointmentDate.getTime() && body.time === row.appointmentTime) return { id, status: row.status };
          const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(date).toUpperCase();
          const [hours, leave, bookings] = await Promise.all([
            tx.doctorSchedule.findMany({ where: { doctorId: row.doctorId, dayOfWeek, isActive: true } }),
            tx.doctorLeave.findFirst({ where: { doctorId: row.doctorId, isApproved: true, startDate: { lte: date }, endDate: { gte: date } } }),
            tx.appointment.findMany({ where: { doctorId: row.doctorId, appointmentDate: date, id: { not: id } },
              select: { appointmentTime: true, status: true, tokenNumber: true } }),
          ]);
          const start = minutes(body.time!);
          const duration = row.doctor.consultationDurationMin;
          const window = hours.find((slot) => minutes(slot.startTime) <= start && start + duration <= minutes(slot.endTime));
          const active = bookings.filter((booking) => !['CANCELLED', 'NO_SHOW'].includes(booking.status));
          if (leave || !window || active.some((booking) => Math.abs(minutes(booking.appointmentTime) - start) < duration)
            || active.filter((booking) => booking.appointmentTime >= window.startTime && booking.appointmentTime < window.endTime).length >= window.maxPatients) {
            throw new ConflictException('The doctor is unavailable at that time.');
          }
          update.appointmentDate = date;
          update.appointmentTime = body.time;
          if (date.getTime() !== row.appointmentDate.getTime()) {
            update.tokenNumber = Math.max(0, ...bookings.map((booking) => booking.tokenNumber)) + 1;
          }
        }
        const changed = await tx.appointment.update({ where: { id }, data: update, select: { id: true, status: true } });
        const [reception, deptAdmins] = await Promise.all([
          tx.user.findMany({
            where: { hospitalId: row.hospitalId, deletedAt: null, isActive: true,
              userRoles: { some: { hospitalId: row.hospitalId, branchId: row.branchId, role: { name: Role.RECEPTIONIST } } } },
            select: { id: true },
          }),
          tx.user.findMany({
            where: { hospitalId: row.hospitalId, deletedAt: null, isActive: true,
              userRoles: { some: { hospitalId: row.hospitalId, branchId: row.branchId, departmentId: row.departmentId, role: { name: Role.DEPARTMENT_ADMIN } } } },
            select: { id: true },
          }),
        ]);
        const recipients = new Set<string>();
        if (row.doctor?.employee?.userId) recipients.add(row.doctor.employee.userId);
        for (const u of reception) recipients.add(u.id);
        for (const u of deptAdmins) recipients.add(u.id);
        if (row.patient?.userId) recipients.add(row.patient.userId);

        const patientFullName = row.patient ? `${row.patient.firstName} ${row.patient.lastName}`.trim() : 'Patient';
        const docUser = row.doctor?.employee?.user;
        const docName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Consultant Doctor';
        const dateStr = (update.appointmentDate instanceof Date ? update.appointmentDate : row.appointmentDate).toISOString().slice(0, 10);
        const timeStr = (typeof update.appointmentTime === 'string' ? update.appointmentTime : row.appointmentTime) || '';
        const deptName = row.department?.name || 'OPD';
        const branchName = row.branch?.name ? ` (${row.branch.name})` : '';
        const actorLabel = patient ? 'Patient' : 'Reception';
        const reasonSuffix = cleanReason ? ` Reason: ${cleanReason}.` : '';

        if (recipients.size > 0) {
          await tx.notification.createMany({
            data: Array.from(recipients, (userId) => ({
              userId,
              hospitalId: row.hospitalId,
              branchId: row.branchId,
              type: 'APPOINTMENT',
              title: cancel ? 'Appointment Cancelled' : 'Appointment Rescheduled',
              message: `Appointment ${row.appointmentNumber} for ${patientFullName}${row.patient?.uhid ? ` (${row.patient.uhid})` : ''} with ${docName} (${deptName}${branchName}) on ${dateStr} at ${timeStr} IST was ${cancel ? 'cancelled' : 'rescheduled'} by ${actorLabel}.${reasonSuffix}`,
            })),
          });
        }
        await tx.auditLog.create({
          data: {
            hospitalId: row.hospitalId,
            branchId: row.branchId,
            userId: actor.id,
            userEmail: actor.email,
            userRole: actor.role,
            action: cancel ? 'CANCEL' : 'RESCHEDULE',
            resource: 'APPOINTMENT',
            resourceId: id,
            details: {
              appointmentNumber: row.appointmentNumber,
              cancelledByRole: actor.role,
              ...(cleanReason ? { reason: cleanReason } : {}),
            },
          },
        });
        return changed;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) {
        throw new ConflictException('Appointment availability changed. Refresh and try again.');
      }
      throw error;
    }
  }

  async portal(actor: AuthUserDto, page?: string) {
    const patient = await this.ownPatient(actor);
    const pageNumber = Number(page ?? 1);
    if (!Number.isSafeInteger(pageNumber) || pageNumber < 1 || pageNumber > 1000) throw new BadRequestException('Invalid page.');
    const where = { patientId: patient.id, hospitalId: actor.hospitalId };
    const recent = { take: 20, skip: (pageNumber - 1) * 20, orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }] };
    const doctor = { select: { employee: { select: { user: { select: { firstName: true, lastName: true } } } } } } as const;
    const branch = {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        hospital: { select: { id: true, name: true } },
      },
    } as const;
    const [appointments, consultations, prescriptions, labOrders, radiology, invoices, admissions, vitals] = await Promise.all([
      this.prisma.appointment.findMany({ where, ...recent, select: {
        id: true, appointmentNumber: true, appointmentDate: true, appointmentTime: true, status: true, type: true,
        source: true, reasonForVisit: true, tokenNumber: true, isPaid: true, doctor, branch, department: { select: { name: true } },
      } }),
      this.prisma.consultation.findMany({ where: { ...where, status: 'COMPLETED' }, ...recent,
        select: { id: true, appointmentId: true, createdAt: true, diagnosisNotes: true, treatmentPlan: true, followUpDate: true, doctor, branch } }),
      this.prisma.prescription.findMany({ where, ...recent, select: {
        id: true, prescriptionNumber: true, dispensingStatus: true, createdAt: true, doctor, branch,
        consultation: { select: { appointmentId: true } },
        items: { select: { id: true, dosage: true, frequency: true, durationDays: true, instructions: true, route: true,
          dispensedQuantity: true, medicine: { select: { brandName: true, strength: true } } } },
      } }),
      this.prisma.labOrder.findMany({ where, ...recent, select: {
        id: true, orderNumber: true, status: true, reportReleasedAt: true, createdAt: true, doctor, branch,
        orderItems: { select: { labTest: { select: { name: true } } } },
      } }),
      this.prisma.radiologyOrder.findMany({ where, ...recent, select: {
        id: true, orderNumber: true, status: true, reportReleasedAt: true, createdAt: true,
        findings: true, impression: true, test: { select: { name: true, modality: true } }, doctor, branch,
      } }),
      this.prisma.invoice.findMany({ where, ...recent, select: {
        id: true, invoiceNumber: true, appointmentId: true, admissionId: true, totalAmount: true, paidAmount: true, status: true, createdAt: true, branch,
        appointment: { select: { id: true, appointmentNumber: true } },
        admission: { select: { id: true, admissionNumber: true } },
        items: { select: { id: true, description: true, quantity: true, totalPrice: true } },
        payments: {
          orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }],
          select: { id: true, amount: true, paymentMethod: true, transactionReference: true, paymentStatus: true, createdAt: true, branch },
        },
      } }),
      this.prisma.admission.findMany({ where, ...recent, select: {
        id: true, admissionNumber: true, status: true, admittedAt: true, dischargedAt: true, dischargeSummary: true,
        admittingDoctor: doctor, branch, ward: { select: { name: true } }, bed: { select: { bedNumber: true } },
      } }),
      this.prisma.vitalsRecord.findMany({ where, ...recent, select: {
        id: true, createdAt: true, systolicBp: true, diastolicBp: true, pulseRate: true, oxygenSaturation: true, temperature: true, branch,
      } }),
    ]);
    const released = await this.prisma.labResult.findMany({
      where: { labOrder: { ...where, id: { in: labOrders.map((row) => row.id) }, status: 'COMPLETED', reportReleasedAt: { not: null } } },
      select: { id: true, labOrderId: true, measuredValue: true, unit: true, referenceRange: true,
        parameter: { select: { parameterName: true } } },
    });
    return {
      patient, appointments, consultations, prescriptions, invoices, vitals,
      labOrders: labOrders.map((row) => ({ ...row, results: released.filter((result) => result.labOrderId === row.id) })),
      radiology: radiology.map(({ findings, impression, ...row }) => ({
        ...row, findings: row.status === 'REPORT_RELEASED' && row.reportReleasedAt ? findings : null,
        impression: row.status === 'REPORT_RELEASED' && row.reportReleasedAt ? impression : null,
      })),
      admissions: admissions.map(({ dischargeSummary, ...row }) => ({
        ...row, dischargeSummary: row.status === 'DISCHARGED' && row.dischargedAt ? dischargeSummary : null,
      })),
    };
  }

  async receptionRequests(actor: AuthUserDto) {
    if (actor.role !== Role.RECEPTIONIST || !actor.branchId) throw new ForbiddenException('Reception branch required.');
    return this.prisma.appointmentRequest.findMany({
      where: { hospitalId: actor.hospitalId, branchId: actor.branchId, status: 'PATIENT_LINKED', patient: { deletedAt: null } },
      orderBy: [{ submittedAt: 'desc' }, { id: 'asc' }], take: 50,
      select: { id: true, specialty: true, preferredDate: true,
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } } },
    });
  }

  async requestAppointment(actor: AuthUserDto, body: { doctorId?: string; preferredDate?: string; reason?: string }) {
    const patient = await this.ownPatient(actor);
    if (typeof body?.doctorId !== 'string' || typeof body?.preferredDate !== 'string') {
      throw new BadRequestException('Choose a doctor and preferred date.');
    }
    let preferredDate: Date;
    try {
      preferredDate = parseAppointmentPreferredDate(body.preferredDate, new Date());
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid preferred date.');
    }
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: body.doctorId, hospitalId: actor.hospitalId, branch: { isActive: true },
        employee: { user: { isActive: true, deletedAt: null } } },
      select: { id: true, branchId: true, department: { select: { name: true } },
        employee: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!doctor) throw new NotFoundException('Doctor is unavailable.');
    const reasonText = (body.reason?.trim() || 'General Consultation').slice(0, 200);
    const submissionKey = createHash('sha256').update(JSON.stringify([patient.id, doctor.id, body.preferredDate, reasonText])).digest('hex');
    const scope = { hospitalId: actor.hospitalId, branchId: doctor.branchId };
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${submissionKey}, 0))::text AS locked`;
      const where = { hospitalId_submissionKey: { hospitalId: actor.hospitalId, submissionKey } };
      const existing = await tx.appointmentRequest.findUnique({ where, select: { id: true, status: true } });
      if (existing) return existing;
      const request = await tx.appointmentRequest.create({ data: {
        ...scope, patientId: patient.id, status: 'PATIENT_LINKED',
        patientName: (patient.firstName + ' ' + patient.lastName).slice(0, 120),
        phone: patient.phone.slice(0, 16), specialty: doctor.department.name.slice(0, 80), preferredDate, submissionKey,
      }, select: { id: true, status: true } });
      const deptAdminsAndReception = await tx.user.findMany({
        where: { hospitalId: scope.hospitalId, isActive: true, deletedAt: null,
          userRoles: { some: { ...scope, role: { name: { in: [Role.RECEPTIONIST, Role.DEPARTMENT_ADMIN] } } } } },
        select: { id: true },
      });
      const recipients = new Set([doctor.employee.userId, ...deptAdminsAndReception.map((u) => u.id)]);
      if (recipients.size) await tx.notification.createMany({ data: Array.from(recipients, (userId) => ({
        ...scope, userId, type: 'APPOINTMENT_REQUEST', title: 'New Appointment Booking Request',
        message: `Patient ${patient.firstName} ${patient.lastName} (${patient.uhid}) requested appointment with Dr. ${doctor.employee.user.firstName} ${doctor.employee.user.lastName} on ${body.preferredDate}. Reason: ${reasonText}. Reference: ${request.id}.`,
      })) });
      // Notify patient
      await tx.notification.create({ data: {
        ...scope, userId: actor.id, type: 'APPOINTMENT', title: 'Appointment Request Submitted',
        message: `Your appointment request with Dr. ${doctor.employee.user.firstName} ${doctor.employee.user.lastName} on ${body.preferredDate} has been sent to the Department Admin for scheduling.`,
      } });
      return request;
    });
  }

  async portalDoctors(actor: AuthUserDto, search: string = '') {
    await this.ownPatient(actor);
    const term = search.trim().slice(0, 80);
    return this.prisma.doctor.findMany({
      where: { hospitalId: actor.hospitalId, branch: { isActive: true }, employee: { user: { isActive: true, deletedAt: null } },
        ...(term && { OR: [
          { employee: { user: { firstName: { contains: term, mode: 'insensitive' } } } },
          { employee: { user: { lastName: { contains: term, mode: 'insensitive' } } } },
          { specialization: { contains: term, mode: 'insensitive' } },
          { department: { name: { contains: term, mode: 'insensitive' } } },
          { branch: { name: { contains: term, mode: 'insensitive' } } },
        ] }) },
      orderBy: { id: 'asc' }, take: 50, select: {
        id: true, designation: true, specialization: true, consultationFee: true, experienceYears: true,
        gender: true, bio: true, consultationDurationMin: true,
        department: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, city: true, address: true, hospital: { select: { name: true } } } },
        employee: { select: { user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } } } },
        qualifications: { select: { degree: true, institution: true, yearPassed: true } },
        schedules: { select: { dayOfWeek: true, startTime: true, endTime: true, maxPatients: true } },
      },
    });
  }

  async updateOwnContact(actor: AuthUserDto, body: {
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
  }) {
    const patient = await this.ownPatient(actor);
    const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : patient.phone;
    const addressLine1 = typeof body?.addressLine1 === 'string' && body.addressLine1.trim() ? body.addressLine1.trim() : patient.addressLine1;
    const addressLine2 = typeof body?.addressLine2 === 'string' ? body.addressLine2.trim() : (patient.addressLine2 || '');
    const city = typeof body?.city === 'string' ? body.city.trim() : (patient.city || '');
    const state = typeof body?.state === 'string' ? body.state.trim() : (patient.state || '');
    const postalCode = typeof body?.postalCode === 'string' ? body.postalCode.trim() : (patient.postalCode || '');
    const emergencyContactName = typeof body?.emergencyContactName === 'string' ? body.emergencyContactName.trim() : (patient.emergencyContactName || '');
    const emergencyContactPhone = typeof body?.emergencyContactPhone === 'string' ? body.emergencyContactPhone.trim() : (patient.emergencyContactPhone || '');
    const emergencyContactRelation = typeof body?.emergencyContactRelation === 'string' ? body.emergencyContactRelation.trim() : (patient.emergencyContactRelation || '');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.patient.update({
        where: { id: patient.id, hospitalId: actor.hospitalId, userId: actor.id, deletedAt: null },
        data: {
          phone, addressLine1, addressLine2, city, state, postalCode,
          emergencyContactName, emergencyContactPhone, emergencyContactRelation,
        },
      });
      return updated;
    });
  }

  private async generateUhid(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `KZN-${year}-${sequence}`;
  }

  async checkDuplicate(phone: string, email?: string) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
      select: {
        id: true,
        uhid: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    return {
      isDuplicate: !!existing,
      existingPatient: existing || null,
    };
  }

  async register(dto: RegisterPatientDto, actor?: AuthUserDto) {
    // Check duplicates first
    const dupCheck = await this.checkDuplicate(dto.phone, dto.email);
    if (dupCheck.isDuplicate) {
      throw new BadRequestException(
        `A patient with this phone or email already exists under UHID: ${dupCheck.existingPatient?.uhid}`
      );
    }

    // Default hospital if not supplied
    let hospitalId = actor?.hospitalId || dto.hospitalId;
    if (!hospitalId) {
      const defaultHosp = await this.prisma.hospital.findFirst();
      if (!defaultHosp) throw new BadRequestException('Hospital context required');
      hospitalId = defaultHosp.id;
    }

    let registrationBranchId: string;
    if (actor && actor.role !== Role.SUPER_ADMIN) {
      if (!actor.branchId) {
        throw new ForbiddenException('Operational staff requires branch scope.');
      }
      registrationBranchId = actor.branchId;
    } else {
      registrationBranchId = dto.registrationBranchId || dto.branchId || '';
      if (!registrationBranchId) {
        const defaultBranch = await this.prisma.branch.findFirst({
          where: { hospitalId, isActive: true, deletedAt: null },
        });
        if (!defaultBranch) throw new BadRequestException('Active hospital branch required for patient registration');
        registrationBranchId = defaultBranch.id;
      }
    }

    const normalizedEmail = dto.email?.trim().toLowerCase() || null;

    return this.prisma.$transaction(async (tx) => {
      let userId: string | undefined;
      let portalAccess: { email: string; accessCode: string; expiresAt: string } | undefined;

      if (normalizedEmail) {
        const existingUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existingUser) {
          throw new ConflictException(`A login account with email "${normalizedEmail}" already exists.`);
        }

        const patientRole = await tx.role.findFirst({ where: { name: Role.PATIENT } });
        if (patientRole) {
          const placeholderPassword = randomBytes(24).toString('base64url');
          const passwordHash = await bcrypt.hash(placeholderPassword, 12);
          const createdUser = await tx.user.create({
            data: {
              hospitalId,
              email: normalizedEmail,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone.trim(),
              isActive: true,
            },
          });
          await tx.userRole.create({
            data: {
              hospitalId,
              userId: createdUser.id,
              roleId: patientRole.id,
              branchId: null,
              departmentId: null,
              scopeKey: `patient:${createdUser.id}`,
            },
          });
          const code = randomToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
          await tx.accountAccessToken.create({
            data: {
              hospitalId,
              userId: createdUser.id,
              issuedById: actor?.id || createdUser.id,
              purpose: 'INVITATION',
              digest: tokenDigest(code),
              expiresAt,
            },
          });
          userId = createdUser.id;
          portalAccess = {
            email: normalizedEmail,
            accessCode: code,
            expiresAt: expiresAt.toISOString(),
          };
        }
      }

      const uhid = await this.generateUhid();
      const patient = await tx.patient.create({
        data: {
          uhid,
          userId,
          hospitalId,
          registrationBranchId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup,
          phone: dto.phone.trim(),
          email: normalizedEmail,
          nationalId: dto.nationalId,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country || 'India',
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          emergencyContactRelation: dto.emergencyContactRelation,
          allergies: dto.allergies || [],
          medicalHistoryNotes: dto.medicalHistoryNotes,
        },
      });

      await tx.auditLog.create({
        data: {
          hospitalId,
          branchId: registrationBranchId,
          userId: actor?.id,
          userEmail: actor?.email || 'system@aalayamhospital.com',
          userRole: actor?.role || 'RECEPTIONIST',
          action: 'CREATE',
          resource: 'PATIENT',
          resourceId: patient.id,
          details: { uhid: patient.uhid, name: `${patient.firstName} ${patient.lastName}`, accountProvisioned: !!userId },
        },
      });

      return { ...patient, ...(portalAccess ? { portalAccess } : {}) };
    });
  }

  async search(query?: string, phone?: string, uhid?: string, actor?: AuthUserDto) {
    if (actor?.role === Role.PATIENT) return [await this.ownPatient(actor)];
    const where: any = { deletedAt: null };
    let nestedBranchFilter: { branchId: string } | undefined = undefined;

    if (actor) {
      where.hospitalId = actor.hospitalId;
      if (actor.role === Role.SUPER_ADMIN) {
        // Super Admin has organization-wide scope across all branches
      } else {
        if (!actor.branchId) {
          throw new ForbiddenException('Operational staff requires branch scope.');
        }
        nestedBranchFilter = { branchId: actor.branchId };
        where.OR = [
          { registrationBranchId: actor.branchId },
          { appointments: { some: { branchId: actor.branchId } } },
          { admissions: { some: { branchId: actor.branchId } } },
          { consultations: { some: { appointment: { branchId: actor.branchId } } } },
        ];
      }
    }

    const searchConditions: any[] = [];
    if (uhid) {
      searchConditions.push({ uhid: { contains: uhid, mode: 'insensitive' } });
    } else if (phone) {
      searchConditions.push({ phone: { contains: phone } });
    } else if (query) {
      searchConditions.push({
        OR: [
          { uhid: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      });
    }

    if (searchConditions.length > 0) {
      where.AND = searchConditions;
    }

    return this.prisma.patient.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        admissions: {
          where: { status: 'ADMITTED', ...(nestedBranchFilter || {}) },
          include: { ward: true, bed: true },
        },
      },
    });
  }

  async findOne(id: string, actor?: AuthUserDto) {
    if (actor?.role === Role.PATIENT) {
      const profile = await this.ownPatient(actor);
      if (profile.id !== id) throw new NotFoundException('Patient not found');
      return profile;
    }
    const where: any = { id, deletedAt: null };
    let nestedBranchFilter: { branchId: string } | undefined = undefined;

    if (actor) {
      where.hospitalId = actor.hospitalId;
      if (actor.role === Role.SUPER_ADMIN) {
        // Super Admin has organization-wide scope across all branches
      } else {
        if (!actor.branchId) {
          throw new ForbiddenException('Operational staff requires branch scope.');
        }
        nestedBranchFilter = { branchId: actor.branchId };
        where.OR = [
          { registrationBranchId: actor.branchId },
          { appointments: { some: { branchId: actor.branchId } } },
          { admissions: { some: { branchId: actor.branchId } } },
          { consultations: { some: { appointment: { branchId: actor.branchId } } } },
        ];
      }
    }

    const patient = await this.prisma.patient.findFirst({
      where,
      include: {
        appointments: {
          where: nestedBranchFilter,
          take: 5,
          orderBy: { appointmentDate: 'desc' },
          include: { doctor: { include: { employee: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } } } },
        },
        consultations: {
          where: nestedBranchFilter ? { appointment: { branchId: nestedBranchFilter.branchId } } : undefined,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { doctor: { include: { employee: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } } } },
        },
        prescriptions: {
          where: nestedBranchFilter,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { medicine: true } } },
        },
        vitalsRecords: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        admissions: {
          where: nestedBranchFilter,
          take: 3,
          orderBy: { admittedAt: 'desc' },
          include: { ward: true, bed: true },
        },
        invoices: {
          where: nestedBranchFilter,
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, dto: any, actor?: AuthUserDto) {
    if (actor?.role === Role.PATIENT) throw new ForbiddenException('Use your contact settings to edit your profile.');
    await this.findOne(id, actor);

    const data: any = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.phone) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) data.gender = dto.gender;
    if (dto.bloodGroup) data.bloodGroup = dto.bloodGroup;
    if (dto.addressLine1) data.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) data.addressLine2 = dto.addressLine2;
    if (dto.city) data.city = dto.city;
    if (dto.state) data.state = dto.state;
    if (dto.postalCode) data.postalCode = dto.postalCode;
    if (dto.emergencyContactName) data.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone) data.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.emergencyContactRelation) data.emergencyContactRelation = dto.emergencyContactRelation;
    if (dto.allergies) data.allergies = dto.allergies;
    if (dto.medicalHistoryNotes !== undefined) data.medicalHistoryNotes = dto.medicalHistoryNotes;

    const updated = await this.prisma.patient.update({
      where: { id },
      data,
    });

    if (actor) {
      await this.prisma.auditLog.create({
        data: {
          hospitalId: actor.hospitalId || undefined,
          branchId: actor.branchId || undefined,
          userId: actor.id,
          userEmail: actor.email,
          userRole: actor.role,
          action: 'UPDATE',
          resource: 'PATIENT',
          resourceId: updated.id,
          details: { uhid: updated.uhid, updatedFields: Object.keys(data) },
        },
      });
    }

    return updated;
  }
}
