import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOperationalScope } from '../common/utils/operational-scope';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private scope(actor: AuthUserDto, requestedBranchId?: string): Prisma.UserWhereInput {
    const scope = resolveOperationalScope(actor, requestedBranchId);
    const where: Prisma.UserWhereInput = { hospitalId: scope.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN) {
      if (scope.branchId) where.employee = { branchId: scope.branchId };
      return where;
    }
    if (scope.branchId) {
      where.employee = {
        branchId: scope.branchId,
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
      };
    }
    return where;
  }

  async findAll(actor: AuthUserDto, role?: string, search?: string, requestedBranchId?: string) {
    const where = this.scope(actor, requestedBranchId);
    const conditions: Prisma.UserWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (role) {
      conditions.push({
        userRoles: {
          some: {
            role: { name: role },
          },
        },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        userRoles: {
          select: { role: { select: { id: true, name: true } } },
        },
        employee: {
          select: {
            employeeCode: true,
            designation: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      role: u.userRoles[0]?.role.name,
    }));
  }

  async findOne(actor: AuthUserDto, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { AND: [this.scope(actor), { id }] },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true,
        userRoles: { include: { role: true } },
        employee: {
          include: { department: true, doctor: true, nursingProfile: true },
        },
        patient: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
