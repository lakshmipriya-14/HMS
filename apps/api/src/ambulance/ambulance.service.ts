import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAmbulanceRequestDto, UpdateTripStatusDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class AmbulanceService {
  constructor(private prisma: PrismaService) {}

  private async generateTripCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.ambulanceTrip.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `AMB-${year}-${sequence}`;
  }

  async getVehicles(actor?: AuthUserDto, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.ambulance.findMany({
      where,
      orderBy: { isAvailable: 'desc' },
    });
  }

  async getDrivers(actor?: AuthUserDto, branchId?: string) {
    const where: any = {};
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.ambulanceDriver.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });
  }

  async getActiveTrips(actor?: AuthUserDto, branchId?: string) {
    const where: any = {
      status: { notIn: ['HANDOVER_COMPLETE', 'CANCELLED'] },
    };
    if (actor) {
      const scope = resolveOperationalScope(actor, branchId);
      where.hospitalId = scope.hospitalId;
      if (scope.branchId) where.branchId = scope.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.ambulanceTrip.findMany({
      where,
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

  async createEmergencyRequest(dto: CreateAmbulanceRequestDto, actor?: AuthUserDto) {
    let branchIdFilter: string | undefined = undefined;
    if (actor) {
      const scope = resolveOperationalScope(actor);
      branchIdFilter = scope.branchId;
    }

    // Find first available ambulance and driver in the branch
    const ambulance = await this.prisma.ambulance.findFirst({
      where: {
        isAvailable: true,
        ...(branchIdFilter ? { branchId: branchIdFilter } : {}),
      },
    });

    const driver = await this.prisma.ambulanceDriver.findFirst({
      where: {
        isOnDuty: true,
        ...(branchIdFilter ? { branchId: branchIdFilter } : {}),
      },
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
          destinationHospital: dto.destinationHospitalId || 'UYIRINAI Hospital',
          severity: dto.emergencySeverity || 'CRITICAL',
          patientConditionSummary: dto.patientConditionSummary,
          status: 'DISPATCHED',
          hospitalId: ambulance.hospitalId,
          branchId: ambulance.branchId,
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

  async updateTripStatus(tripId: string, dto: UpdateTripStatusDto, actor?: AuthUserDto) {
    const trip = await this.prisma.ambulanceTrip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    if (actor) {
      assertBranchAccess(actor, trip.branchId);
    }

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

  async createVehicle(
    actor: AuthUserDto,
    dto: { vehicleNumber: string; model: string; type?: string; branchId?: string }
  ) {
    const scope = resolveOperationalScope(actor, dto.branchId);
    if (!scope.branchId) throw new BadRequestException('Branch scope required for ambulance');

    const existing = await this.prisma.ambulance.findUnique({
      where: { vehicleNumber: dto.vehicleNumber },
    });
    if (existing) throw new BadRequestException('An ambulance with this vehicle number already exists');

    const vehicle = await this.prisma.ambulance.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        vehicleNumber: dto.vehicleNumber,
        model: dto.model,
        type: dto.type || 'ADVANCED_LIFE_SUPPORT',
        isAvailable: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: scope.hospitalId,
        branchId: scope.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'CREATE',
        resource: 'AMBULANCE',
        resourceId: vehicle.id,
        details: { vehicleNumber: vehicle.vehicleNumber },
      },
    });

    return vehicle;
  }

  async updateVehicle(
    actor: AuthUserDto,
    id: string,
    dto: { model?: string; type?: string; isAvailable?: boolean }
  ) {
    const vehicle = await this.prisma.ambulance.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const updated = await this.prisma.ambulance.update({
      where: { id },
      data: {
        ...(dto.model ? { model: dto.model } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: vehicle.hospitalId,
        branchId: vehicle.branchId,
        userId: actor.id,
        userEmail: actor.email || 'hospital_admin@demo.uyirinai.test',
        userRole: actor.role,
        action: 'UPDATE',
        resource: 'AMBULANCE',
        resourceId: id,
        details: dto,
      },
    });

    return updated;
  }

  async updateVehicleStatus(actor: AuthUserDto, id: string, isAvailable: boolean) {
    return this.updateVehicle(actor, id, { isAvailable });
  }
}
