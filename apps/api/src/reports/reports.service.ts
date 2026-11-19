import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
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
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({
        where: { appointmentDate: { gte: today, lt: tomorrow } },
      }),
      this.prisma.admission.count({ where: { status: 'ADMITTED' } }),
      this.prisma.bed.count(),
      this.prisma.bed.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.labOrder.count({
        where: { status: { in: ['ORDERED', 'COLLECTED', 'PROCESSING'] } },
      }),
      this.prisma.medicine.count({ where: { currentStock: { lte: 50 } } }),
      this.prisma.ambulanceTrip.count({
        where: { status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] } },
      }),
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow } },
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
}
