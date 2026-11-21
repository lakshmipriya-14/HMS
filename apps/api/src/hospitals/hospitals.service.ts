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
}
