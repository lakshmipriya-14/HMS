import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRadiologyOrderDto, UploadRadiologyReportDto } from '@multispeciality-hms/contracts';

@Injectable()
export class RadiologyService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.radiologyOrder.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RAD-${year}-${sequence}`;
  }

  async getCatalogue() {
    return this.prisma.radiologyTest.findMany({
      where: { isActive: true },
      orderBy: { modality: 'asc' },
    });
  }

  async createOrder(dto: CreateRadiologyOrderDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const orderNumber = await this.generateOrderNumber();

    return this.prisma.radiologyOrder.create({
      data: {
        orderNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        testId: dto.testId,
        priority: dto.priority || 'ROUTINE',
        clinicalIndication: dto.clinicalIndication,
        status: 'ORDERED',
        hospitalId: doctor.hospitalId,
        branchId: doctor.branchId,
      },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        test: true,
      },
    });
  }

  async getWorklist() {
    return this.prisma.radiologyOrder.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, gender: true, dateOfBirth: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        test: true,
      },
    });
  }

  async uploadReport(orderId: string, dto: UploadRadiologyReportDto, radiologistUserId: string) {
    return this.prisma.radiologyOrder.update({
      where: { id: orderId },
      data: {
        status: 'REPORT_RELEASED',
        findings: dto.findings,
        impression: dto.impression,
        criticalAlert: dto.criticalAlert,
        imageUrl: dto.imageUrl,
        reportReleasedAt: new Date(),
        releasedByUserId: radiologistUserId,
      },
      include: { test: true, patient: true },
    });
  }
}
