import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(actor?: AuthUserDto, departmentId?: string, designation?: string, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId, departmentId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
      if (scope.departmentId) where.departmentId = scope.departmentId;
    } else {
      if (branchId) where.branchId = branchId;
      if (departmentId) where.departmentId = departmentId;
    }
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

  async findOne(id: string, actor?: AuthUserDto) {
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
    if (actor) {
      assertBranchAccess(actor, doctor.branchId);
    }
    return doctor;
  }
}
