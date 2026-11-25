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

  async createMedicine(
    actor: AuthUserDto,
    dto: {
      code?: string;
      brandName: string;
      genericName: string;
      category: string;
      strength: string;
      dosageForm: string;
      manufacturer: string;
      unitPrice: number;
      reorderLevel?: number;
      initialStock?: number;
      batchNumber?: string;
      expiryDate?: string;
      branchId?: string;
    }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId);
    const code = dto.code || `MED-${Date.now().toString(36).toUpperCase()}`;

    const medicine = await this.prisma.medicine.create({
      data: {
        code,
        brandName: dto.brandName,
        genericName: dto.genericName,
        category: dto.category,
        strength: dto.strength,
        dosageForm: dto.dosageForm,
        manufacturer: dto.manufacturer,
        unitPrice: dto.unitPrice,
        reorderLevel: dto.reorderLevel ?? 20,
        currentStock: dto.initialStock ?? 0,
        isActive: true,
        ...(dto.initialStock && dto.initialStock > 0 && scope.branchId
          ? {
              batches: {
                create: {
                  batchNumber: dto.batchNumber || `BAT-${Date.now().toString(36).toUpperCase()}`,
                  quantity: dto.initialStock,
                  expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  purchasePrice: dto.unitPrice * 0.7,
                  sellingPrice: dto.unitPrice,
                  hospitalId: scope.hospitalId,
                  branchId: scope.branchId,
                },
              },
            }
          : {}),
      },
      include: { batches: true },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'CREATE',
        resource: 'PHARMACY_MEDICINE',
        resourceId: medicine.id,
        details: { code: medicine.code, brandName: medicine.brandName },
      },
    });

    return medicine;
  }

  async updateMedicine(
    actor: AuthUserDto,
    id: string,
    dto: {
      brandName?: string;
      genericName?: string;
      category?: string;
      strength?: string;
      dosageForm?: string;
      manufacturer?: string;
      unitPrice?: number;
      reorderLevel?: number;
    }
  ) {
    const scope = resolveOperationalScope(actor);
    const existing = await this.prisma.medicine.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Medicine not found');

    const updated = await this.prisma.medicine.update({
      where: { id },
      data: {
        ...(dto.brandName ? { brandName: dto.brandName } : {}),
        ...(dto.genericName ? { genericName: dto.genericName } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.strength ? { strength: dto.strength } : {}),
        ...(dto.dosageForm ? { dosageForm: dto.dosageForm } : {}),
        ...(dto.manufacturer ? { manufacturer: dto.manufacturer } : {}),
        ...(dto.unitPrice !== undefined ? { unitPrice: dto.unitPrice } : {}),
        ...(dto.reorderLevel !== undefined ? { reorderLevel: dto.reorderLevel } : {}),
      },
      include: { batches: true },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'UPDATE',
        resource: 'PHARMACY_MEDICINE',
        resourceId: id,
        details: dto,
      },
    });

    return updated;
  }

  async toggleMedicineStatus(actor: AuthUserDto, id: string) {
    const scope = resolveOperationalScope(actor);
    const existing = await this.prisma.medicine.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Medicine not found');

    const updated = await this.prisma.medicine.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'PHARMACY_MEDICINE',
        resourceId: id,
        details: { isActive: updated.isActive },
      },
    });

    return updated;
  }

  async addBatch(
    actor: AuthUserDto,
    medicineId: string,
    dto: {
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      costPrice?: number;
      sellingPrice?: number;
      branchId?: string;
    }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId);
    if (!scope.branchId) throw new BadRequestException('Branch scope required for medicine batch');

    const medicine = await this.prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) throw new NotFoundException('Medicine not found');

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.medicineBatch.create({
        data: {
          medicineId,
          batchNumber: dto.batchNumber,
          quantity: dto.quantity,
          expiryDate: new Date(dto.expiryDate),
          purchasePrice: dto.costPrice ?? (Number(medicine.unitPrice) * 0.7),
          sellingPrice: dto.sellingPrice ?? Number(medicine.unitPrice),
          hospitalId: scope.hospitalId,
          branchId: scope.branchId!,
        },
      });

      await tx.medicine.update({
        where: { id: medicineId },
        data: { currentStock: { increment: dto.quantity } },
      });

      await tx.auditLog.create({
        data: {
          hospitalId: scope.hospitalId,
          branchId: scope.branchId,
          userId: actor.id,
          userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
          userRole: actor.role,
          action: 'CREATE',
          resource: 'MEDICINE_BATCH',
          resourceId: batch.id,
          details: { batchNumber: batch.batchNumber, quantity: dto.quantity },
        },
      });

      return batch;
    });
  }

  async getInventoryMovements(actor: AuthUserDto, branchId?: string) {
    const scope = resolveOperationalScope(actor, branchId);
    return this.prisma.inventoryMovement.findMany({
      where: {
        hospitalId: scope.hospitalId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
      },
      include: {
        medicine: true,
        batch: true,
      },
      orderBy: { id: 'desc' },
      take: 50,
    });
  }
}
