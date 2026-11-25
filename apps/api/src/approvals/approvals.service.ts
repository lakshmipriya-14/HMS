import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { resolveOperationalScope, assertBranchAccess } from '../common/utils/operational-scope';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async getPendingApprovals(actor: AuthUserDto, branchId?: string) {
    const scope = resolveOperationalScope(actor, branchId);
    const hospitalId = scope.hospitalId;
    const targetBranchId = scope.branchId;

    // 1. Appointment Requests
    const appointmentRequests = await this.prisma.appointmentRequest.findMany({
      where: {
        hospitalId,
        ...(targetBranchId ? { branchId: targetBranchId } : {}),
        status: 'PENDING',
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    // 2. Doctor Leave Requests
    const doctorLeaves = await this.prisma.doctorLeave.findMany({
      where: {
        isApproved: false,
        doctor: {
          hospitalId,
          ...(targetBranchId ? { branchId: targetBranchId } : {}),
        },
      },
      include: {
        doctor: {
          include: {
            employee: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 3. Bed Turnover Clearances (Beds in CLEANING or MAINTENANCE)
    const bedTurnovers = await this.prisma.bed.findMany({
      where: {
        hospitalId,
        ...(targetBranchId ? { branchId: targetBranchId } : {}),
        status: { in: ['CLEANING', 'MAINTENANCE'] },
      },
      include: {
        ward: {
          select: { id: true, name: true, code: true, floorNumber: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // 4. Department Leadership Coverage (Departments without assigned Dept Admin)
    const departments = await this.prisma.department.findMany({
      where: {
        hospitalId,
        ...(targetBranchId ? { branchId: targetBranchId } : {}),
        isActive: true,
      },
      include: {
        userRoleScopes: {
          where: { role: { name: Role.DEPARTMENT_ADMIN } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const unassignedDepartments = departments.filter(
      (d) => !d.userRoleScopes || d.userRoleScopes.length === 0
    );

    return {
      summary: {
        totalPending:
          appointmentRequests.length +
          doctorLeaves.length +
          bedTurnovers.length +
          unassignedDepartments.length,
        appointmentRequestsCount: appointmentRequests.length,
        doctorLeavesCount: doctorLeaves.length,
        bedTurnoversCount: bedTurnovers.length,
        unassignedDepartmentsCount: unassignedDepartments.length,
      },
      appointmentRequests,
      doctorLeaves,
      bedTurnovers,
      unassignedDepartments,
    };
  }

  async processAction(
    actor: AuthUserDto,
    type: 'appointment-request' | 'doctor-leave' | 'bed-turnover',
    id: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ) {
    const scope = resolveOperationalScope(actor);
    const userEmail = actor.email || 'hospital_admin@demo.uyirinai.test';

    if (type === 'appointment-request') {
      const request = await this.prisma.appointmentRequest.findUnique({
        where: { id },
      });
      if (!request) throw new NotFoundException('Appointment request not found');

      if (action === 'APPROVE') {
        const updated = await this.prisma.appointmentRequest.update({
          where: { id },
          data: { status: 'BOOKED' },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'APPROVE',
            resource: 'APPOINTMENT_REQUEST',
            resourceId: id,
            details: {
              patientName: request.patientName,
              specialty: request.specialty,
              notes: notes || 'Approved by Hospital Admin',
            },
          },
        });

        return { message: 'Appointment request approved & scheduled.', data: updated };
      } else {
        await this.prisma.appointmentRequest.delete({
          where: { id },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'REJECT',
            resource: 'APPOINTMENT_REQUEST',
            resourceId: id,
            details: {
              patientName: request.patientName,
              reason: notes || 'Rejected by Hospital Admin',
            },
          },
        });

        return {
          message: 'Appointment request rejected and removed.',
          data: { id, status: 'REJECTED' },
        };
      }
    } else if (type === 'doctor-leave') {
      const leave = await this.prisma.doctorLeave.findUnique({
        where: { id },
        include: { doctor: { include: { employee: { include: { user: true } } } } },
      });
      if (!leave) throw new NotFoundException('Doctor leave application not found');

      const doctorName = leave.doctor?.employee?.user
        ? `${leave.doctor.employee.user.firstName} ${leave.doctor.employee.user.lastName}`
        : 'Doctor';

      if (action === 'APPROVE') {
        const updated = await this.prisma.doctorLeave.update({
          where: { id },
          data: { isApproved: true },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'APPROVE',
            resource: 'DOCTOR_LEAVE',
            resourceId: id,
            details: {
              doctorName,
              startDate: leave.startDate,
              endDate: leave.endDate,
              notes: notes || 'Leave approved',
            },
          },
        });

        return { message: `Leave for ${doctorName} approved.`, data: updated };
      } else {
        await this.prisma.doctorLeave.delete({
          where: { id },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'REJECT',
            resource: 'DOCTOR_LEAVE',
            resourceId: id,
            details: {
              doctorName,
              reason: notes || 'Leave application rejected',
            },
          },
        });

        return { message: `Leave for ${doctorName} rejected.`, data: { id, isApproved: false } };
      }
    } else if (type === 'bed-turnover') {
      const bed = await this.prisma.bed.findUnique({
        where: { id },
        include: { ward: true },
      });
      if (!bed) throw new NotFoundException('Bed not found');
      assertBranchAccess(actor, bed.branchId);

      if (action === 'APPROVE') {
        const updated = await this.prisma.bed.update({
          where: { id },
          data: { status: 'AVAILABLE', currentPatientId: null, currentPatientName: null },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'APPROVE',
            resource: 'BED_TURNOVER',
            resourceId: id,
            details: {
              bedNumber: bed.bedNumber,
              roomNumber: bed.roomNumber,
              wardName: bed.ward?.name,
              notes:
                notes ||
                'Housekeeping turnover signed off. Available for admission.',
            },
          },
        });

        return {
          message: `Bed ${bed.bedNumber} cleared and returned to AVAILABLE status.`,
          data: updated,
        };
      } else {
        const updated = await this.prisma.bed.update({
          where: { id },
          data: { status: 'MAINTENANCE' },
        });

        await this.prisma.auditLog.create({
          data: {
            hospitalId: scope.hospitalId,
            branchId: scope.branchId,
            userId: actor.id,
            userEmail,
            userRole: actor.role,
            action: 'REJECT',
            resource: 'BED_TURNOVER',
            resourceId: id,
            details: {
              bedNumber: bed.bedNumber,
              reason: notes || 'Sanitization failed inspection. Sent for maintenance.',
            },
          },
        });

        return {
          message: `Bed ${bed.bedNumber} flagged for MAINTENANCE.`,
          data: updated,
        };
      }
    }

    throw new BadRequestException('Invalid approval type');
  }

  async getApprovalHistory(actor: AuthUserDto, branchId?: string) {
    const scope = resolveOperationalScope(actor, branchId);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        hospitalId: scope.hospitalId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        action: { in: ['APPROVE', 'REJECT', 'CLEAR'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      approverEmail: log.userEmail,
      timestamp: log.createdAt,
      details: log.details,
    }));
  }
}
