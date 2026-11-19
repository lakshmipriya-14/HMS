import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(departmentId?: string, designation?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (designation) where.designation = designation;

    return this.prisma.doctor.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        qualifications: true,
        schedules: { where: { isActive: true } },
      },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        employee: {
          include: { user: true },
        },
        qualifications: true,
        schedules: true,
        leaves: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }
}
