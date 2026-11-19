import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(hospitalId?: string) {
    return this.prisma.department.findMany({
      where: {
        deletedAt: null,
        ...(hospitalId ? { hospitalId } : {}),
      },
      include: {
        doctors: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            employee: { include: { user: true } },
            qualifications: true,
          },
        },
        wards: true,
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }
}
