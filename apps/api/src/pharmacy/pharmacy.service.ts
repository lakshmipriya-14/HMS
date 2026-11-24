import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DispensePrescriptionDto, AdjustStockDto, AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  async adjustStock(dto: AdjustStockDto, userId?: string, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.findUnique({
        where: { id: dto.medicineId },
      });
      if (!medicine) throw new NotFoundException('Medicine not found');

      if (dto.batchId) {
        const batch = await tx.medicineBatch.findUnique({
          where: { id: dto.batchId },
        });
        if (batch) {
          const newQty = Math.max(0, batch.quantity + dto.quantityChange);
          await tx.medicineBatch.update({
            where: { id: dto.batchId },
            data: { quantity: newQty },
          });
        }
      }

      return tx.medicine.update({
        where: { id: dto.medicineId },
        data: { currentStock: { increment: dto.quantityChange } },
        include: { batches: true },
      });
    });
  }

  async getMedicines(actor?: AuthUserDto, search?: string, branchId?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const batchWhere: any = { quantity: { gt: 0 } };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      if (scope.branchId) batchWhere.branchId = scope.branchId;
    } else if (branchId) {
      batchWhere.branchId = branchId;
    }

    return this.prisma.medicine.findMany({
      where,
      include: {
        batches: {
          where: batchWhere,
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { brandName: 'asc' },
    });
  }

  async getDispenseQueue(actor?: AuthUserDto, branchId?: string) {
    const where: any = { dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED'] } };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.prescription.findMany({
      where,
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
                batches: {
                  where: { quantity: { gt: 0 }, ...(where.branchId ? { branchId: where.branchId } : {}) },
                  orderBy: { expiryDate: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  async dispense(prescriptionId: string, dto: DispensePrescriptionDto, pharmacistId: string, actor?: AuthUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.findUnique({
        where: { id: prescriptionId },
      });
      if (!prescription) throw new NotFoundException('Prescription not found');

      if (actor) {
        assertBranchAccess(actor, prescription.branchId);
      }

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

        if (batch.branchId !== prescription.branchId) {
          throw new BadRequestException('Selected medicine batch belongs to another branch');
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
            hospitalId: prescription.hospitalId,
            branchId: prescription.branchId,
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

  async getLowStockAlerts(actor?: AuthUserDto, branchId?: string) {
    let batchFilter: any = undefined;
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      if (scope.branchId) batchFilter = { branchId: scope.branchId };
    } else if (branchId) {
      batchFilter = { branchId };
    }

    return this.prisma.medicine.findMany({
      where: {
        currentStock: { lte: 50 },
        ...(batchFilter ? { batches: { some: batchFilter } } : {}),
      },
      include: {
        batches: {
          where: batchFilter,
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
  }

  async getExpiryAlerts(actor?: AuthUserDto, branchId?: string) {
    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);

    const where: any = {
      expiryDate: { lte: next90Days },
      quantity: { gt: 0 },
    };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.medicineBatch.findMany({
      where,
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
