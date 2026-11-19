import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DispensePrescriptionDto } from '@multispeciality-hms/contracts';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  async getMedicines(search?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.medicine.findMany({
      where,
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { brandName: 'asc' },
    });
  }

  async getDispenseQueue() {
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
        items: {
          include: {
            medicine: {
              include: {
                batches: { where: { quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  async dispense(prescriptionId: string, dto: DispensePrescriptionDto, pharmacistId: string) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        // Check batch availability
        const batch = await tx.medicineBatch.findUnique({
          where: { id: item.batchId },
          include: { medicine: true },
        });

        if (!batch || batch.quantity < item.dispensedQuantity) {
          throw new BadRequestException(
            `Insufficient stock for ${batch?.medicine?.brandName || 'medicine batch'}`
          );
        }

        // Deduct batch stock
        await tx.medicineBatch.update({
          where: { id: item.batchId },
          data: { quantity: { decrement: item.dispensedQuantity } },
        });

        // Deduct medicine total stock
        await tx.medicine.update({
          where: { id: batch.medicineId },
          data: { currentStock: { decrement: item.dispensedQuantity } },
        });

        // Record dispensing transaction
        await tx.dispensingRecord.create({
          data: {
            prescriptionId,
            batchId: item.batchId,
            dispensedQuantity: item.dispensedQuantity,
            pharmacistUserId: pharmacistId,
          },
        });

        // Update prescription item dispensed count
        await tx.prescriptionItem.update({
          where: { id: item.prescriptionItemId },
          data: { dispensedQuantity: { increment: item.dispensedQuantity } },
        });
      }

      // Mark prescription as DISPENSED
      return tx.prescription.update({
        where: { id: prescriptionId },
        data: { dispensingStatus: 'DISPENSED' },
        include: { items: true },
      });
    });
  }

  async getLowStockAlerts() {
    return this.prisma.medicine.findMany({
      where: {
        currentStock: { lte: 50 },
      },
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
  }

  async getExpiryAlerts() {
    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);

    return this.prisma.medicineBatch.findMany({
      where: {
        expiryDate: { lte: next90Days },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
