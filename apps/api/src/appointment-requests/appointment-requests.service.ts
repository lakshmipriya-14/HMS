import {
  BadRequestException, ConflictException, HttpException, HttpStatus,
  Injectable, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { normalizeAppointmentPhone, parseAppointmentPreferredDate, PUBLIC_APPOINTMENT_SPECIALTIES, PublicAppointmentRequestReceipt } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PublicAppointmentRequestDto } from './public-appointment-request.dto';

const HOUR_MS = 3_600_000;
const SPECIALTIES = new Set<string>(PUBLIC_APPOINTMENT_SPECIALTIES);
const receipt = { id: true } as const;

@Injectable()
export class AppointmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: PublicAppointmentRequestDto): Promise<PublicAppointmentRequestReceipt> {
    const patientName = input.patientName.normalize('NFC').trim().replace(/ +/g, ' ');
    if (!/^[\p{L}\p{M} .’'\-]+$/u.test(patientName) || !/\p{L}/u.test(patientName) || patientName.length > 120) {
      throw new BadRequestException('Enter a valid patient name.');
    }
    if (!SPECIALTIES.has(input.specialty)) throw new BadRequestException('Choose a listed specialty.');
    const now = new Date();
    let phone: string;
    let preferredDate: Date;
    try {
      phone = normalizeAppointmentPhone(input.phone);
      preferredDate = parseAppointmentPreferredDate(input.preferredDate, now);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid appointment details.');
    }
    const submissionKey = createHash('sha256').update(JSON.stringify([
      patientName.toLowerCase(), phone, input.specialty, input.preferredDate,
    ])).digest('hex');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await this.prisma.$transaction(async tx => {
          const hospital = await tx.hospital.findFirst({
            where: { code: 'UYIRINAI', isActive: true, deletedAt: null },
            select: { id: true },
          });
          if (!hospital) throw new ServiceUnavailableException('Online appointment requests are currently unavailable.');

          const prior = await tx.appointmentRequest.findUnique({
            where: { hospitalId_submissionKey: { hospitalId: hospital.id, submissionKey } },
            select: receipt,
          });
          if (prior) return prior;

          const recent = await tx.appointmentRequest.count({
            where: { hospitalId: hospital.id, phone, submittedAt: { gte: new Date(now.getTime() - HOUR_MS) } },
          });
          if (recent >= 5) {
            throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
          }

          return tx.appointmentRequest.create({
            data: { hospitalId: hospital.id, patientName, phone, specialty: input.specialty, preferredDate, submissionKey },
            select: receipt,
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return { reference: row.id };
      } catch (error) {
        if (error instanceof HttpException) throw error;
        const code = (error as { code?: string } | null)?.code;
        if (attempt < 2 && (code === 'P2034' || code === 'P2002')) continue;
        throw new ServiceUnavailableException('Could not save the request. Please retry with the same details.');
      }
    }
    throw new ServiceUnavailableException('Could not save the request. Please retry with the same details.');
  }

  // Internal only. A future Reception controller must authorize this branch,
  // route the request to it, and verify the patient's identity before calling.
  async linkVerifiedPatient(scope: { hospitalId: string; branchId: string }, requestId: string, patientId: string) {
    await this.prisma.$transaction(async tx => {
      const patient = await tx.patient.findFirst({
        where: { id: patientId, hospitalId: scope.hospitalId, deletedAt: null }, select: { id: true },
      });
      if (!patient) throw new NotFoundException('Verified patient was not found in this hospital.');

      const updated = await tx.appointmentRequest.updateMany({
        where: { ...scope, id: requestId, status: 'PENDING', patientId: null },
        data: { patientId: patient.id, status: 'PATIENT_LINKED' },
      });
      if (updated.count === 1) return;

      const existing = await tx.appointmentRequest.findFirst({
        where: { ...scope, id: requestId }, select: { patientId: true },
      });
      if (!existing) throw new NotFoundException('Request not found in this branch.');
      if (existing.patientId !== patient.id) throw new ConflictException('The patient link cannot be changed.');
    });
  }
}
