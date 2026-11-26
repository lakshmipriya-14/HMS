import { auditClinicalOrder, resolveClinicalOrderScope } from '../common/utils/clinical-order-scope';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { resolveOperationalScope } from '../common/utils/operational-scope';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, CreatePrescriptionDto, Role } from '@multispeciality-hms/contracts';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  private async generatePrescriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.prescription.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RX-${year}-${sequence}`;
  }

  async searchMedicines(search?: string) {
    const query = typeof search === 'string' ? search.trim() : '';
    if (query.length < 2 || query.length > 100) return [];
    return this.prisma.medicine.findMany({
      where: { isActive: true, OR: [
        { brandName: { contains: query, mode: 'insensitive' } },
        { genericName: { contains: query, mode: 'insensitive' } },
      ] },
      orderBy: [{ brandName: 'asc' }, { id: 'asc' }], take: 25,
      select: { id: true, brandName: true, genericName: true, strength: true, dosageForm: true },
    });
  }

  async create(dto: CreatePrescriptionDto, actor: AuthUserDto) {
    const doctor = await resolveClinicalOrderScope(this.prisma, actor, dto.doctorId, dto.patientId);

    if (!Array.isArray(dto.items) || dto.items.length < 1 || dto.items.length > 50
      || dto.items.some((item) => !item || typeof item.medicineId !== 'string'
        || !Number.isSafeInteger(item.durationDays) || item.durationDays < 1
        || ![item.dosage, item.frequency].every((value) => typeof value === 'string' && value.trim()))) {
      throw new BadRequestException('Enter a medicine, dosage, frequency and duration for each item.');
    }
    const medicineIds = [...new Set(dto.items.map((item) => item.medicineId))];
    if (await this.prisma.medicine.count({ where: { id: { in: medicineIds }, isActive: true } }) !== medicineIds.length) {
      throw new BadRequestException('Choose active medicines from the catalogue.');
    }
    if (dto.consultationId && !await this.prisma.consultation.findFirst({
      where: { id: dto.consultationId, patientId: dto.patientId, doctorId: dto.doctorId, ...doctor, status: 'COMPLETED' },
      select: { id: true },
    })) throw new NotFoundException('Completed consultation not found in this scope.');

    const prescriptionNumber = await this.generatePrescriptionNumber();

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.prescription.create({
        data: {
          prescriptionNumber,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          consultationId: dto.consultationId,
          notes: dto.notes,
          dispensingStatus: 'PENDING',
          hospitalId: doctor.hospitalId,
          branchId: doctor.branchId,
          items: {
            create: dto.items.map((item) => ({
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              durationDays: item.durationDays,
              instructions: item.instructions,
              route: item.route || 'Oral',
              hospitalId: doctor.hospitalId,
              branchId: doctor.branchId,
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
      await auditClinicalOrder(tx, actor, doctor, 'PRESCRIPTION', order.id);
      return order;
    });
  }

  private readScope(actor: AuthUserDto) {
    const { hospitalId, branchId, departmentId } = resolveOperationalScope(actor);
    if ((actor.role === Role.DOCTOR && !actor.doctorProfileId)
      || (actor.role === Role.PATIENT && !actor.patientProfileId)) throw new ForbiddenException('Missing clinical assignment.');
    return { hospitalId, branchId,
      doctor: departmentId ? { departmentId } : undefined,
      doctorId: actor.role === Role.DOCTOR ? actor.doctorProfileId : undefined,
      patientId: actor.role === Role.PATIENT ? actor.patientProfileId : undefined,
    };
  }

  async getQueue(actor: AuthUserDto) {
    return this.prisma.prescription.findMany({
      where: { ...this.readScope(actor), dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED'] } },
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

  async findByPatient(patientId: string, actor: AuthUserDto) {
    return this.prisma.prescription.findMany({
      where: { AND: [this.readScope(actor), { patientId }] },
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
