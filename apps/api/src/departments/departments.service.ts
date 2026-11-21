import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private where(actor: AuthUserDto): Prisma.DepartmentWhereInput {
    if (!actor.hospitalId) throw new ForbiddenException('Missing hospital scope.');
    const hospital = { hospitalId: actor.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN || actor.role === Role.HOSPITAL_ADMIN) return hospital;
    if (!actor.branchId || (actor.role === Role.DEPARTMENT_ADMIN && !actor.departmentId)) {
      throw new ForbiddenException('Missing branch or department scope.');
    }
    return { ...hospital, id: actor.departmentId, OR: [{ branchId: actor.branchId }, { branchId: null }] };
  }

  private include(actor: AuthUserDto): Prisma.DepartmentInclude {
    return {
      doctors: {
        where: { hospitalId: actor.hospitalId, branchId: actor.branchId },
        include: { employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, qualifications: true },
      },
      wards: { where: { hospitalId: actor.hospitalId, branchId: actor.branchId } },
    };
  }

  async findAll(actor: AuthUserDto) {
    return this.prisma.department.findMany({ where: this.where(actor), include: this.include(actor) });
  }

  async findOne(actor: AuthUserDto, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { AND: [this.where(actor), { id }] }, include: this.include(actor),
    });
    if (!department) throw new NotFoundException('Department not found.');
    return department;
  }
}
