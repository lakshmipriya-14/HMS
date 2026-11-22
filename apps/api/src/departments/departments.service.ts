import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOperationalScope } from '../common/utils/operational-scope';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private where(actor: AuthUserDto, requestedBranchId?: string): Prisma.DepartmentWhereInput {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const hospital = { hospitalId: scope.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN) {
      if (scope.branchId) {
        return { ...hospital, branchId: scope.branchId };
      }
      return hospital;
    }
    if (actor.role === Role.HOSPITAL_ADMIN) {
      return { ...hospital, branchId: scope.branchId };
    }
    if (actor.role === Role.DEPARTMENT_ADMIN) {
      return { ...hospital, id: scope.departmentId, branchId: scope.branchId };
    }
    return { ...hospital, branchId: scope.branchId };
  }

  private include(actor: AuthUserDto, requestedBranchId?: string): Prisma.DepartmentInclude {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const doctorWhere: Prisma.DoctorWhereInput = { hospitalId: scope.hospitalId };
    const wardWhere: Prisma.WardWhereInput = { hospitalId: scope.hospitalId };
    if (scope.branchId) {
      doctorWhere.branchId = scope.branchId;
      wardWhere.branchId = scope.branchId;
    }
    return {
      doctors: {
        where: doctorWhere,
        include: { employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, qualifications: true },
      },
      wards: { where: wardWhere },
    };
  }

  async findAll(actor: AuthUserDto, requestedBranchId?: string) {
    return this.prisma.department.findMany({
      where: this.where(actor, requestedBranchId),
      include: this.include(actor, requestedBranchId),
      orderBy: { name: 'asc' },
    });
  }

  async findOne(actor: AuthUserDto, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { AND: [this.where(actor), { id }] },
      include: this.include(actor),
    });
    if (!department) throw new NotFoundException('Department not found.');
    return department;
  }
}
