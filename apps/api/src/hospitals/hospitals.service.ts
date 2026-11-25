import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  private scope(user: AuthUserDto) {
    if (!user.hospitalId || ![Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Missing hospital-wide administration scope.');
    }
    return { id: user.hospitalId, deletedAt: null };
  }

  async findAll(user: AuthUserDto) {
    return this.prisma.hospital.findMany({
      where: this.scope(user),
      include: {
        branches: true,
        departments: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findOne(user: AuthUserDto, id: string) {
    const hospital = await this.prisma.hospital.findFirst({
      where: { AND: [this.scope(user), { id }] },
      include: {
        branches: true,
        departments: true,
        wards: true,
      },
    });
    if (!hospital) throw new NotFoundException('Hospital not found');
    return hospital;
  }

  async update(
    user: AuthUserDto,
    id: string,
    dto: {
      name?: string;
      tamilName?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      phone?: string;
      emergencyPhone?: string;
      email?: string;
    }
  ) {
    await this.findOne(user, id);
    const updated = await this.prisma.hospital.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.tamilName !== undefined ? { tamilName: dto.tamilName } : {}),
        ...(dto.addressLine1 ? { addressLine1: dto.addressLine1 } : {}),
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.state ? { state: dto.state } : {}),
        ...(dto.postalCode ? { postalCode: dto.postalCode } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.emergencyPhone !== undefined ? { emergencyPhone: dto.emergencyPhone } : {}),
        ...(dto.email ? { email: dto.email } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: id,
        userId: user.id,
        userEmail: user.email || 'hospital_admin@demo.uyirinai.test',
        userRole: user.role,
        action: 'UPDATE',
        resource: 'HOSPITAL_SETTINGS',
        resourceId: id,
        details: dto,
      },
    });

    return updated;
  }
}
