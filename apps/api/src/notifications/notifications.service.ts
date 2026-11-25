import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope } from '../common/utils/operational-scope';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async broadcastAnnouncement(
    actor: AuthUserDto,
    dto: { title: string; message: string; targetRole?: string; branchId?: string }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId);

    const users = await this.prisma.user.findMany({
      where: {
        hospitalId: scope.hospitalId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        isActive: true,
        ...(dto.targetRole ? { userRoles: { some: { role: { name: dto.targetRole as any } } } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) return { createdCount: 0 };

    const notifications = users.map((u) => ({
      userId: u.id,
      title: dto.title,
      message: dto.message,
      type: 'ANNOUNCEMENT',
      hospitalId: scope.hospitalId,
      branchId: scope.branchId,
      isRead: false,
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'CREATE',
        resource: 'ANNOUNCEMENT',
        details: { title: dto.title, targetCount: users.length, targetRole: dto.targetRole },
      },
    });

    return { createdCount: users.length };
  }
}
