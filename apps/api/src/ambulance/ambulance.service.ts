import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAmbulanceRequestDto, UpdateTripStatusDto } from '@multispeciality-hms/contracts';

@Injectable()
export class AmbulanceService {
  constructor(private prisma: PrismaService) {}

  private async generateTripCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.ambulanceTrip.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `AMB-${year}-${sequence}`;
  }

  async getVehicles() {
    return this.prisma.ambulance.findMany({
      orderBy: { isAvailable: 'desc' },
    });
  }

  async getDrivers() {
    return this.prisma.ambulanceDriver.findMany({
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });
  }

  async getActiveTrips() {
    return this.prisma.ambulanceTrip.findMany({
      where: {
        status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] },
      },
      include: {
        ambulance: true,
        driver: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { dispatchedAt: 'desc' },
    });
  }

  async createEmergencyRequest(dto: CreateAmbulanceRequestDto) {
    // Find first available ambulance and driver
    const ambulance = await this.prisma.ambulance.findFirst({
      where: { isAvailable: true },
    });

    const driver = await this.prisma.ambulanceDriver.findFirst({
      where: { isOnDuty: true },
    });

    if (!ambulance || !driver) {
      throw new BadRequestException('No available ambulance vehicle or on-duty driver found. Please escalate.');
    }

    const tripCode = await this.generateTripCode();

    const trip = await this.prisma.$transaction(async (tx) => {
      // Mark vehicle unavailable
      await tx.ambulance.update({
        where: { id: ambulance.id },
        data: { isAvailable: false },
      });

      return tx.ambulanceTrip.create({
        data: {
          tripCode,
          ambulanceId: ambulance.id,
          driverId: driver.id,
          callerName: dto.callerName,
          callerPhone: dto.callerPhone,
          pickupLocation: dto.pickupLocation,
          severity: dto.emergencySeverity || 'CRITICAL',
          patientConditionSummary: dto.patientConditionSummary,
          status: 'DISPATCHED',
        },
        include: {
          ambulance: true,
          driver: {
            include: { employee: { include: { user: true } } },
          },
        },
      });
    });

    return trip;
  }

  async updateTripStatus(tripId: string, dto: UpdateTripStatusDto) {
    const trip = await this.prisma.ambulanceTrip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const isComplete = dto.status === 'HANDOVER_COMPLETE' || dto.status === 'CANCELLED';

    return this.prisma.$transaction(async (tx) => {
      if (isComplete) {
        // Free vehicle
        await tx.ambulance.update({
          where: { id: trip.ambulanceId },
          data: { isAvailable: true },
        });
      }

      return tx.ambulanceTrip.update({
        where: { id: tripId },
        data: {
          status: dto.status,
          ...(dto.status === 'ARRIVED_AT_SCENE' ? { arrivedSceneAt: new Date() } : {}),
          ...(dto.status === 'ARRIVED_HOSPITAL' ? { arrivedHospitalAt: new Date() } : {}),
          ...(isComplete ? { completedAt: new Date() } : {}),
          ...(dto.notes ? { handoverNotes: dto.notes } : {}),
        },
        include: { ambulance: true },
      });
    });
  }
}
