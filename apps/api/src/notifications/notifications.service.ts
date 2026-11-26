import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope } from '../common/utils/operational-scope';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private reminderTimer?: ReturnType<typeof setInterval>;
  private runningReminders = false;

  onModuleInit() {
    void this.enqueueReminders();
    this.reminderTimer = setInterval(() => void this.enqueueReminders(), 5 * 60_000);
    this.reminderTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.reminderTimer);
  }

  private async enqueueReminders() {
    if (this.runningReminders) return;
    this.runningReminders = true;
    try {
      await this.prisma.$queryRaw`SELECT "uyirinai_enqueue_patient_reminders"()`;
    } catch (error) {
      this.logger.warn('Unable to enqueue appointment reminders. Check database connectivity and migration status.');
    } finally {
      this.runningReminders = false;
    }
  }

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

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
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
