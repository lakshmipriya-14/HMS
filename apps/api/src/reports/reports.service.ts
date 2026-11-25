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

  async getHospitalAdminDashboard(hospitalId: string, branchId?: string, startDate?: string, endDate?: string) {
    if (!hospitalId) throw new ForbiddenException('Missing hospital scope.');

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    const filterStart = startDate ? new Date(startDate) : todayStart;
    const filterEnd = endDate ? new Date(endDate) : todayEnd;

    const baseWhere = {
      hospitalId,
      ...(branchId ? { branchId } : {}),
    };

    const [
      totalPatients,
      todayOpdPatients,
      currentIpdPatients,
      emergencyPatients,
      totalBeds,
      occupiedBeds,
      availableBeds,
      totalDoctors,
      availableDoctors,
      totalStaff,
      activeStaff,
      dailyRev,
      weeklyRev,
      monthlyRev,
      departmentRows,
      recentAuditLogs,
      pendingAppointmentRequests,
      lowStockMeds,
      recentAbnormalVitals,
      activeAmbulanceTrips,
    ] = await Promise.all([
      // Total registered patients
      this.prisma.patient.count({
        where: {
          hospitalId,
          deletedAt: null,
          ...(branchId ? { registrationBranchId: branchId } : {}),
        },
      }),
      // Today OPD patients (appointments)
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          appointmentDate: { gte: filterStart, lt: filterEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      // Current IPD patients (admissions)
      this.prisma.admission.count({
        where: {
          ...baseWhere,
          status: 'ADMITTED',
        },
      }),
      // Emergency admissions
      this.prisma.admission.count({
        where: {
          ...baseWhere,
          status: 'ADMITTED',
          OR: [
            { admissionReason: { contains: 'emergency', mode: 'insensitive' } },
            { initialDiagnosis: { contains: 'emergency', mode: 'insensitive' } },
          ],
        },
      }),
      // Beds
      this.prisma.bed.count({ where: baseWhere }),
      this.prisma.bed.count({ where: { ...baseWhere, status: 'OCCUPIED' } }),
      this.prisma.bed.count({ where: { ...baseWhere, status: 'AVAILABLE' } }),
      // Doctors
      this.prisma.doctor.count({ where: baseWhere }),
      this.prisma.doctor.count({ where: { ...baseWhere, isAvailableToday: true } }),
      // Staff
      this.prisma.employee.count({ where: baseWhere }),
      this.prisma.employee.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      // Revenue
      this.prisma.payment.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: todayStart, lt: todayEnd },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: weekStart },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: monthStart },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true },
      }),
      // Departments with statistics
      this.prisma.department.findMany({
        where: {
          hospitalId,
          deletedAt: null,
          ...(branchId ? { branchId } : {}),
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          headOfDepartmentId: true,
          _count: {
            select: {
              doctors: true,
              appointments: true,
              wards: true,
            },
          },
          userRoleScopes: {
            where: { role: { name: 'DEPARTMENT_ADMIN' } },
            select: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      // Recent activities
      this.prisma.auditLog.findMany({
        where: {
          hospitalId,
          ...(branchId ? { branchId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          userEmail: true,
          userRole: true,
          createdAt: true,
          details: true,
        },
      }),
      // Pending requests
      this.prisma.appointmentRequest.count({
        where: {
          hospitalId,
          status: 'PENDING',
          ...(branchId ? { branchId } : {}),
        },
      }),
      // Low stock medicines
      this.prisma.medicine.count({
        where: {
          currentStock: { lte: 50 },
          batches: { some: { hospitalId, ...(branchId ? { branchId } : {}) } },
        },
      }),
      // Abnormal vitals
      this.prisma.vitalsRecord.count({
        where: {
          hospitalId,
          ...(branchId ? { branchId } : {}),
          isAbnormal: true,
          createdAt: { gte: todayStart },
        },
      }),
      // Active ambulance dispatches
      this.prisma.ambulanceTrip.count({
        where: {
          hospitalId,
          status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
    ]);

    const bedOccupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const departmentStats = departmentRows.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      isActive: d.isActive,
      doctorCount: d._count.doctors,
      appointmentsCount: d._count.appointments,
      wardsCount: d._count.wards,
      departmentAdmin: d.userRoleScopes[0]?.user || null,
      hasHod: !!d.headOfDepartmentId,
    }));

    return {
      overview: {
        totalPatients,
        todayOpdPatients,
        currentIpdPatients,
        emergencyPatients,
        totalBeds,
        occupiedBeds,
        availableBeds,
        bedOccupancyPercentage,
        totalDoctors,
        availableDoctors,
        totalStaff,
        activeStaff,
        dailyRevenue: dailyRev._sum.amount ? Number(dailyRev._sum.amount) : 0,
        weeklyRevenue: weeklyRev._sum.amount ? Number(weeklyRev._sum.amount) : 0,
        monthlyRevenue: monthlyRev._sum.amount ? Number(monthlyRev._sum.amount) : 0,
      },
      departmentStats,
      recentActivities: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        userEmail: log.userEmail,
        userRole: log.userRole,
        createdAt: log.createdAt.toISOString(),
        details: log.details,
      })),
      pendingApprovals: {
        appointmentRequests: pendingAppointmentRequests,
        unassignedDepartments: departmentStats.filter((d) => !d.departmentAdmin).length,
      },
      criticalAlerts: {
        lowStockMedicines: lowStockMeds,
        abnormalVitalsToday: recentAbnormalVitals,
        activeAmbulanceTrips,
      },
    };
  }

  async getHospitalReport(
    hospitalId: string,
    reportType: string,
    branchId?: string,
    departmentId?: string,
    fromDate?: string,
    toDate?: string
  ) {
    if (!hospitalId) throw new ForbiddenException('Missing hospital scope.');

    const start = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = toDate ? new Date(toDate) : new Date();

    const baseWhere = {
      hospitalId,
      ...(branchId ? { branchId } : {}),
      ...(departmentId ? { departmentId } : {}),
    };

    switch (reportType.toUpperCase()) {
      case 'OPD':
        return this.prisma.appointment.findMany({
          where: {
            ...baseWhere,
            appointmentDate: { gte: start, lte: end },
          },
          include: {
            patient: { select: { uhid: true, firstName: true, lastName: true, phone: true } },
            doctor: { include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } } },
            department: { select: { name: true, code: true } },
          },
          orderBy: { appointmentDate: 'desc' },
        });

      case 'IPD':
        return this.prisma.admission.findMany({
          where: {
            hospitalId,
            ...(branchId ? { branchId } : {}),
            admittedAt: { gte: start, lte: end },
          },
          include: {
            patient: { select: { uhid: true, firstName: true, lastName: true, gender: true } },
            ward: { select: { name: true, code: true } },
            bed: { select: { roomNumber: true, bedNumber: true } },
          },
          orderBy: { admittedAt: 'desc' },
        });

      case 'REVENUE':
        return this.prisma.payment.findMany({
          where: {
            hospitalId,
            ...(branchId ? { branchId } : {}),
            createdAt: { gte: start, lte: end },
          },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                patient: { select: { firstName: true, lastName: true, uhid: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'PHARMACY':
        return this.prisma.medicine.findMany({
          include: {
            batches: {
              where: {
                hospitalId,
                ...(branchId ? { branchId } : {}),
              },
            },
          },
        });

      default:
        return this.prisma.auditLog.findMany({
          where: {
            hospitalId,
            ...(branchId ? { branchId } : {}),
            createdAt: { gte: start, lte: end },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
    }
  }
}
