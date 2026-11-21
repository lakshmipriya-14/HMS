import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLogs(actor: AuthUserDto, action?: string, resource?: string, page = 1, limit = 25, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!actor.hospitalId) throw new ForbiddenException('Missing hospital scope.');
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
      throw new BadRequestException('Invalid audit pagination.');
    }
    const where = { hospitalId: actor.hospitalId, action, resource };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

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
