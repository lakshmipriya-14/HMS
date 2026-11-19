import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.hospital.findMany({
      where: { deletedAt: null },
      include: {
        branches: true,
        departments: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
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
