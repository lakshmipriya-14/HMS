import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto, AuthUserDto, Role } from '@multispeciality-hms/contracts';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

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

    const uhid = await this.generateUhid();

    const patient = await this.prisma.patient.create({
      data: {
        uhid,
        hospitalId,
        registrationBranchId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        phone: dto.phone,
        email: dto.email || null,
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

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        hospitalId,
        branchId: registrationBranchId,
        userId: actor?.id,
        userEmail: actor?.email || 'system@aalayamhospital.com',
        userRole: actor?.role || 'RECEPTIONIST',
        action: 'CREATE',
        resource: 'PATIENT',
        resourceId: patient.id,
        details: { uhid: patient.uhid, name: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return patient;
  }

  async search(query?: string, phone?: string, uhid?: string, actor?: AuthUserDto) {
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
          include: { doctor: { include: { employee: { include: { user: true } } } } },
        },
        consultations: {
          where: nestedBranchFilter ? { appointment: { branchId: nestedBranchFilter.branchId } } : undefined,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { doctor: { include: { employee: { include: { user: true } } } } },
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
    const existing = await this.findOne(id, actor);

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
