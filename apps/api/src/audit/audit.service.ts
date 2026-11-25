import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { resolveOperationalScope } from '../common/utils/operational-scope';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLogs(
    actor: AuthUserDto,
    action?: string,
    resource?: string,
    page = 1,
    limit = 25,
    sortOrder: 'asc' | 'desc' = 'desc',
    search?: string,
    branchId?: string,
    userRole?: string,
    from?: string,
    to?: string
  ) {
    const scope = resolveOperationalScope(actor, branchId);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
      throw new BadRequestException('Invalid audit pagination.');
    }

    const where: any = {
      hospitalId: scope.hospitalId,
      action: action || undefined,
      resource: resource || undefined,
      branchId: scope.branchId || undefined,
      userRole: userRole || undefined,
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to.endsWith('Z') || to.includes('T') ? to : `${to}T23:59:59.999Z`);
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { resource: { contains: q, mode: 'insensitive' } },
        { userEmail: { contains: q, mode: 'insensitive' } },
        { resourceId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
        orderBy: [{ createdAt: sortOrder === 'asc' ? 'asc' : 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const items = rows.map(r => ({
      ...r,
      userName: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : null,
      branchName: r.branch?.name ?? null,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
