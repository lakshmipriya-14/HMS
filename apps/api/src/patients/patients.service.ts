import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto } from '@multispeciality-hms/contracts';

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

  async register(dto: RegisterPatientDto, registeringUserId?: string) {
    // Check duplicates first
    const dupCheck = await this.checkDuplicate(dto.phone, dto.email);
    if (dupCheck.isDuplicate) {
      throw new BadRequestException(
        `A patient with this phone or email already exists under UHID: ${dupCheck.existingPatient?.uhid}`
      );
    }

    // Default hospital if not supplied
    let hospitalId = dto.hospitalId;
    if (!hospitalId) {
      const defaultHosp = await this.prisma.hospital.findFirst();
      if (!defaultHosp) throw new BadRequestException('Hospital context required');
      hospitalId = defaultHosp.id;
    }

    const uhid = await this.generateUhid();

    const patient = await this.prisma.patient.create({
      data: {
        uhid,
        hospitalId,
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
        userId: registeringUserId,
        userEmail: 'system@kizunahospital.com',
        userRole: 'RECEPTIONIST',
        action: 'CREATE',
        resource: 'PATIENT',
        resourceId: patient.id,
        details: { uhid: patient.uhid, name: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return patient;
  }

  async search(query?: string, phone?: string, uhid?: string) {
    const where: any = { deletedAt: null };

    if (uhid) {
      where.uhid = { contains: uhid, mode: 'insensitive' };
    } else if (phone) {
      where.phone = { contains: phone };
    } else if (query) {
      where.OR = [
        { uhid: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    return this.prisma.patient.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        admissions: {
          where: { status: 'ADMITTED' },
          include: { ward: true, bed: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 5,
          orderBy: { appointmentDate: 'desc' },
          include: { doctor: { include: { employee: { include: { user: true } } } } },
        },
        consultations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { doctor: { include: { employee: { include: { user: true } } } } },
        },
        prescriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { medicine: true } } },
        },
        vitalsRecords: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        admissions: {
          take: 3,
          orderBy: { admittedAt: 'desc' },
          include: { ward: true, bed: true },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
