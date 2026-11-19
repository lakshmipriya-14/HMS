import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from '@multispeciality-hms/contracts';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private async generatePrescriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.prescription.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RX-${year}-${sequence}`;
  }

  async create(dto: CreatePrescriptionDto) {
    const prescriptionNumber = await this.generatePrescriptionNumber();

    return this.prisma.prescription.create({
      data: {
        prescriptionNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        consultationId: dto.consultationId,
        notes: dto.notes,
        dispensingStatus: 'PENDING',
        items: {
          create: dto.items.map((item) => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.durationDays,
            instructions: item.instructions,
            route: item.route || 'Oral',
          })),
        },
      },
      include: {
        items: { include: { medicine: true } },
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  async getQueue() {
    return this.prisma.prescription.findMany({
      where: { dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        items: { include: { medicine: true } },
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        items: { include: { medicine: true } },
      },
    });
  }
}
