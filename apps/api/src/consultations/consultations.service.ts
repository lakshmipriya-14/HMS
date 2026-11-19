import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from '@multispeciality-hms/contracts';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConsultationDto) {
    const consultation = await this.prisma.consultation.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        chiefComplaint: dto.chiefComplaint,
        historyOfPresentIllness: dto.historyOfPresentIllness,
        physicalExamNotes: dto.physicalExaminationNotes,
        diagnosisNotes: dto.diagnosisNotes,
        icd10Codes: dto.icd10Codes || [],
        treatmentPlan: dto.treatmentPlan,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        admissionRecommended: dto.admissionRecommended || false,
        status: 'COMPLETED',
      },
    });

    // Update appointment status to COMPLETED
    await this.prisma.appointment.update({
      where: { id: dto.appointmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return consultation;
  }

  async findByPatient(patientId: string) {
    return this.prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
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

  async findOne(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            employee: { include: { user: true } },
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
