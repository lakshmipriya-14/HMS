import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOperationalScope } from './operational-scope';

export async function resolveClinicalOrderScope(prisma: PrismaService, actor: AuthUserDto, doctorId: string, patientId: string) {
  const scope = resolveOperationalScope(actor);
  if (actor.role === Role.DOCTOR && (!actor.doctorProfileId || actor.doctorProfileId !== doctorId)) {
    throw new ForbiddenException('An order must use your assigned doctor profile.');
  }
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, ...scope, employee: { user: { deletedAt: null, isActive: true } } },
    select: { hospitalId: true, branchId: true },
  });
  if (!doctor) throw new NotFoundException('Doctor not found.');
  const patient = await prisma.patient.findFirst({ where: {
    id: patientId, hospitalId: doctor.hospitalId, deletedAt: null,
    ...(actor.role === Role.DOCTOR ? { OR: [
      { appointments: { some: { ...doctor, doctorId, status: { in: ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'] } } } },
      { admissions: { some: { ...doctor, admittingDoctorId: doctorId, status: 'ADMITTED' } } },
    ] } : { registrationBranchId: doctor.branchId }),
  }, select: { id: true } });
  if (!patient) throw new NotFoundException('Patient assignment not found.');
  return doctor;
}

export async function auditClinicalOrder(tx: Prisma.TransactionClient, actor: AuthUserDto,
  scope: { hospitalId: string; branchId: string }, resource: 'PRESCRIPTION' | 'LAB_ORDER' | 'RADIOLOGY_ORDER', id: string) {
  await tx.auditLog.create({ data: {
    ...scope, userId: actor.id, userEmail: actor.email, userRole: actor.role,
    action: 'CREATE', resource, resourceId: id,
  } });
}
