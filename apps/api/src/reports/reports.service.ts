import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(hospitalId?: string, branchId?: string) {
    if (!hospitalId) throw new ForbiddenException('Missing hospital scope.');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      todayAppointments,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      pendingLabOrders,
      lowStockMeds,
      activeAmbulanceTrips,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.patient.count({
        where: {
          hospitalId,
          deletedAt: null,
          ...(branchId ? { registrationBranchId: branchId } : {}),
        },
      }),
      this.prisma.appointment.count({
        where: {
          hospitalId,
          appointmentDate: { gte: today, lt: tomorrow },
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.admission.count({
        where: {
          hospitalId,
          status: 'ADMITTED',
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.bed.count({
        where: {
          hospitalId,
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.bed.count({
        where: {
          hospitalId,
          status: 'OCCUPIED',
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.labOrder.count({
        where: {
          hospitalId,
          status: { in: ['ORDERED', 'COLLECTED', 'PROCESSING'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.medicine.count({
        where: {
          currentStock: { lte: 50 },
          batches: { some: { hospitalId, ...(branchId ? { branchId } : {}) } },
        },
      }),
      this.prisma.ambulanceTrip.count({
        where: {
          hospitalId,
          status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: today, lt: tomorrow },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const bedOccupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalPatients,
      todayAppointments,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      bedOccupancyPercentage,
      pendingLabOrders,
      lowStockMeds,
      activeAmbulanceTrips,
      todayRevenue: todayRevenue._sum.amount ? Number(todayRevenue._sum.amount) : 0,
    };
  }

  async getSuperAdminDashboard(hospitalId?: string) {
    if (!hospitalId) throw new ForbiddenException('Missing hospital scope.');

    const [
      branches,
      activeBranches,
      admins,
      activeAdmins,
      totalUsers,
      employees,
      doctors,
      departments,
      patients,
      roles,
      userRoleGroups,
      branchRows,
      recentAuditLogs,
      pendingRequests,
      unassignedAdmins,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.branch.count({ where: { hospitalId, deletedAt: null, isActive: true } }),
      this.prisma.user.count({
        where: {
          hospitalId,
          deletedAt: null,
          userRoles: { some: { role: { name: { in: ['HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN'] } } } },
        },
      }),
      this.prisma.user.count({
        where: {
          hospitalId,
          deletedAt: null,
          isActive: true,
          userRoles: { some: { role: { name: { in: ['HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN'] } } } },
        },
      }),
      this.prisma.user.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.employee.count({ where: { hospitalId } }),
      this.prisma.doctor.count({ where: { hospitalId } }),
      this.prisma.department.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.patient.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.role.findMany({ select: { id: true, name: true } }),
      this.prisma.userRole.groupBy({
        by: ['roleId'],
        where: { hospitalId, user: { deletedAt: null } },
        _count: { userId: true },
      }),
      this.prisma.branch.findMany({
        where: { hospitalId, deletedAt: null },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          isActive: true,
          _count: {
            select: {
              departments: { where: { deletedAt: null } },
              doctors: true,
              employees: true,
              registeredPatients: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          userEmail: true,
          userRole: true,
          createdAt: true,
          details: true,
          branch: { select: { name: true } },
        },
      }),
      this.prisma.appointmentRequest.count({ where: { hospitalId, status: 'PENDING' } }),
      this.prisma.user.count({
        where: {
          hospitalId,
          deletedAt: null,
          branchId: null,
          userRoles: { some: { role: { name: 'HOSPITAL_ADMIN' } } },
        },
      }),
    ]);

    const roleMap = new Map(roles.map(r => [r.id, r.name]));
    const usersByRole: Record<string, number> = {};
    for (const group of userRoleGroups) {
      const roleName = roleMap.get(group.roleId) || group.roleId;
      usersByRole[roleName] = group._count.userId;
    }

    const branchWiseStats = branchRows.map(b => ({
      id: b.id,
      name: b.name,
      code: b.code,
      city: b.city,
      isActive: b.isActive,
      departmentCount: b._count.departments,
      doctorCount: b._count.doctors,
      employeeCount: b._count.employees,
      patientCount: b._count.registeredPatients,
    }));

    const recentActivities = recentAuditLogs.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userEmail: log.userEmail,
      userRole: log.userRole,
      createdAt: log.createdAt.toISOString(),
      branchName: log.branch?.name ?? null,
      details: log.details,
    }));

    const inactiveBranches = branches - activeBranches;
    const inactiveAdmins = admins - activeAdmins;

    return {
      branches,
      activeBranches,
      inactiveBranches,
      admins,
      activeAdmins,
      inactiveAdmins,
      totalUsers,
      employees,
      doctors,
      departments,
      patients,
      usersByRole,
      branchWiseStats,
      recentActivities,
      pendingActions: {
        pendingAppointmentRequests: pendingRequests,
        inactiveBranches,
        unassignedAdmins,
      },
    };
  }
}
