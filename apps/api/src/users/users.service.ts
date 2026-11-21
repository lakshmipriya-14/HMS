import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private scope(actor: AuthUserDto): Prisma.UserWhereInput {
    if (!actor.hospitalId) throw new ForbiddenException('Missing hospital scope.');
    const scope = { hospitalId: actor.hospitalId, deletedAt: null };
    if (actor.role === Role.SUPER_ADMIN || actor.role === Role.HOSPITAL_ADMIN) return scope;
    if (actor.role !== Role.DEPARTMENT_ADMIN || !actor.branchId || !actor.departmentId) throw new ForbiddenException('Missing department scope.');
    return { ...scope, employee: { branchId: actor.branchId, departmentId: actor.departmentId } };
  }

  async findAll(actor: AuthUserDto, role?: string, search?: string) {
    const where = this.scope(actor);
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.userRoles = {
        some: {
          role: { name: role },
        },
      };
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
      where: { ...this.scope(actor), id },
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
