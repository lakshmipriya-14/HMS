import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(hospitalId?: string) {
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
      this.prisma.patient.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.appointment.count({
        where: { hospitalId, appointmentDate: { gte: today, lt: tomorrow } },
      }),
      this.prisma.admission.count({ where: { hospitalId, status: 'ADMITTED' } }),
      this.prisma.bed.count({ where: { hospitalId } }),
      this.prisma.bed.count({ where: { hospitalId, status: 'OCCUPIED' } }),
      this.prisma.labOrder.count({
        where: { hospitalId, status: { in: ['ORDERED', 'COLLECTED', 'PROCESSING'] } },
      }),
      this.prisma.medicine.count({ where: { currentStock: { lte: 50 }, batches: { some: { hospitalId } } } }),
      this.prisma.ambulanceTrip.count({
        where: { hospitalId, status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] } },
      }),
      this.prisma.payment.aggregate({
        where: { hospitalId, createdAt: { gte: today, lt: tomorrow } },
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
    const [branches, activeBranches, admins, employees, doctors, departments, patients] = await Promise.all([
      this.prisma.branch.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.branch.count({ where: { hospitalId, deletedAt: null, isActive: true } }),
      this.prisma.user.count({ where: { hospitalId, deletedAt: null, userRoles: { some: { role: { name: 'HOSPITAL_ADMIN' }, hospitalId } } } }),
      this.prisma.employee.count({ where: { hospitalId } }),
      this.prisma.doctor.count({ where: { hospitalId } }),
      this.prisma.department.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.patient.count({ where: { hospitalId, deletedAt: null } }),
    ]);
    return { branches, activeBranches, inactiveBranches: branches - activeBranches, admins, employees, doctors, departments, patients };
  }
}
