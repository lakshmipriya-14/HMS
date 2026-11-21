import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabOrderDto, EnterLabResultsDto } from '@multispeciality-hms/contracts';

@Injectable()
export class LaboratoryService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.labOrder.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `LAB-${year}-${sequence}`;
  }

  async getCatalogue() {
    return this.prisma.labTest.findMany({
      where: { isActive: true },
      include: { parameters: true },
      orderBy: { category: 'asc' },
    });
  }

  async createOrder(dto: CreateLabOrderDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const orderNumber = await this.generateOrderNumber();
    const barcode = `BAR-${Date.now().toString().slice(-6)}`;

    return this.prisma.labOrder.create({
      data: {
        orderNumber,
        barcode,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        hospitalId: doctor.hospitalId,
        branchId: doctor.branchId,
        priority: dto.priority || 'ROUTINE',
        clinicalNotes: dto.clinicalNotes,
        status: 'ORDERED',
        orderItems: {
          create: dto.testIds.map((testId) => ({ labTestId: testId })),
        },
      },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        orderItems: { include: { labTest: { include: { parameters: true } } } },
      },
    });
  }

  async getWorklist() {
    return this.prisma.labOrder.findMany({
      where: {
        status: { in: ['ORDERED', 'COLLECTED', 'RECEIVED_IN_LAB', 'PROCESSING'] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, gender: true, dateOfBirth: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        orderItems: { include: { labTest: { include: { parameters: true } } } },
        results: { include: { parameter: true } },
      },
    });
  }

  async collectSample(orderId: string, barcode?: string) {
    return this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status: 'COLLECTED',
        sampleCollectedAt: new Date(),
        ...(barcode ? { barcode } : {}),
      },
    });
  }

  async enterResults(dto: EnterLabResultsDto) {
    // Delete previous draft results for this order if any
    await this.prisma.labResult.deleteMany({ where: { labOrderId: dto.orderId } });

    for (const r of dto.results) {
      await this.prisma.labResult.create({
        data: {
          labOrderId: dto.orderId,
          parameterId: r.testParameterId,
          measuredValue: r.measuredValue,
          unit: r.unit,
          referenceRange: r.referenceRange,
          isAbnormal: r.isAbnormal,
          isCritical: r.isCritical,
          remarks: r.remarks,
          technicianNotes: dto.technicianNotes,
        },
      });
    }

    return this.prisma.labOrder.update({
      where: { id: dto.orderId },
      data: { status: 'PROCESSING' },
      include: { results: true },
    });
  }

  async releaseReport(orderId: string, releasedByUserId: string) {
    return this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        reportReleasedAt: new Date(),
        releasedByUserId,
      },
    });
  }
}
