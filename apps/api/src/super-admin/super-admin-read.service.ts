import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AuthUserDto, SUPER_ADMIN_REPORTS, SuperAdminReport } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListQuery, SuperAdminService } from './super-admin.service';

export type ReportQuery = { from?: string; to?: string; branchIds?: string };
const MAX = 500;

function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('Use YYYY-MM-DD dates.');
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('Invalid report date.');
  }
  return parsed;
}

function range(query: ReportQuery) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
  const end = date(query.to ?? today);
  const from = query.from ? date(query.from) : new Date(end.getTime() - 29 * 86_400_000);
  if (from > end || end.getTime() - from.getTime() > 365 * 86_400_000) {
    throw new BadRequestException('Choose a date range of at most 366 days.');
  }
  const next = end.getTime() + 86_400_000;
  return {
    timestamps: { gte: new Date(from.getTime() - 19_800_000), lt: new Date(next - 19_800_000) },
    calendar: { gte: from, lt: new Date(next) },
  };
}
const stamp = (value?: Date | null) => value?.toISOString() ?? null;

function listing(query: ListQuery) {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 25);
  const search = query.search?.trim() || undefined, ids = query.branchIds?.split(',').filter(Boolean);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100
    || (search && search.length > 120) || (ids && (ids.length > 100 || ids.some(id => id.length > 128)))) {
    throw new BadRequestException('Invalid directory filters.');
  }
  return { page, limit, search, ids, skip: (page - 1) * limit, order: query.sortOrder === 'desc' ? 'desc' as const : 'asc' as const };
}

@Injectable()
export class SuperAdminReadService {
  constructor(private readonly prisma: PrismaService, private readonly admin: SuperAdminService) {}

  async doctors(actor: AuthUserDto, query: ListQuery) {
    const hospitalId = this.admin.scope(actor), { page, limit, search, ids, skip, order } = listing(query);
    const where: Prisma.DoctorWhereInput = {
      hospitalId, branchId: ids?.length ? { in: ids } : undefined,
      employee: { user: { deletedAt: null, isActive: query.status === 'ACTIVE' ? true : query.status === 'INACTIVE' ? false : undefined } },
      OR: search ? [
        { specialization: { contains: search, mode: 'insensitive' } },
        { employee: { employeeCode: { contains: search, mode: 'insensitive' } } },
        { employee: { user: { OR: [
          { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } },
        ] } } },
      ] : undefined,
    };
    const sort: Prisma.DoctorOrderByWithRelationInput = query.sortBy === 'doctorCode' ? { employee: { employeeCode: order } }
      : query.sortBy === 'specialization' ? { specialization: order } : query.sortBy === 'status' ? { employee: { user: { isActive: order } } }
      : { employee: { user: { firstName: order } } };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({
        where, skip, take: limit, orderBy: [sort, { id: 'asc' }],
        select: { id: true, specialization: true, designation: true, licenseNumber: true, experienceYears: true, consultationFee: true,
          branch: { select: { name: true } }, department: { select: { name: true } },
          employee: { select: { employeeCode: true, user: { select: { firstName: true, lastName: true, isActive: true } } } } },
      }), this.prisma.doctor.count({ where }),
    ]);
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async patients(actor: AuthUserDto, query: ListQuery) {
    const hospitalId = this.admin.scope(actor), { page, limit, search, ids, skip, order } = listing(query);
    const admissionScope: Prisma.AdmissionWhereInput = { hospitalId, branchId: ids?.length ? { in: ids } : undefined };
    const where: Prisma.PatientWhereInput = {
      hospitalId, deletedAt: null, registrationBranchId: ids?.length ? { in: ids } : undefined,
      OR: search ? ['uhid', 'firstName', 'lastName'].map(key => ({ [key]: { contains: search, mode: 'insensitive' } })) : undefined,
      AND: query.status === 'ADMITTED' ? [{ admissions: { some: { ...admissionScope, status: 'ADMITTED' } } }]
        : query.status === 'DISCHARGED' ? [{ admissions: { none: { ...admissionScope, status: 'ADMITTED' } } },
          { admissions: { some: { ...admissionScope, status: 'DISCHARGED' } } }]
        : query.status === 'OUTPATIENT' ? [{ admissions: { none: { ...admissionScope, status: { in: ['ADMITTED', 'DISCHARGED'] } } } }] : undefined,
    };
    const lastAdmission = {
      where: { ...admissionScope, status: { in: ['ADMITTED', 'DISCHARGED'] } },
      take: 1, orderBy: [{ status: 'asc' }, { admittedAt: 'desc' }],
      select: { status: true, admittedAt: true },
    } satisfies Prisma.Patient$admissionsArgs;
    const orderBy: Prisma.PatientOrderByWithRelationInput = query.sortBy === 'uhid' ? { uhid: order }
      : query.sortBy === 'createdAt' ? { createdAt: order } : { firstName: order };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where, skip, take: limit, orderBy: [orderBy, { id: 'asc' }],
        select: { id: true, uhid: true, firstName: true, lastName: true, gender: true, createdAt: true,
          registrationBranch: { select: { name: true } }, admissions: lastAdmission },
      }), this.prisma.patient.count({ where }),
    ]);
    return { data: rows.map(({ admissions, ...row }) => ({
      ...row, status: admissions[0]?.status ?? 'OUTPATIENT', admittedAt: admissions[0]?.admittedAt,
    })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  report(actor: AuthUserDto, key: string, query: ReportQuery) {
    return this.prisma.$transaction(tx => this.reportData(tx, actor, key, query), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async exportReport(actor: AuthUserDto, key: string, query: ReportQuery) {
    return this.prisma.$transaction(async tx => {
      const report = await this.reportData(tx, actor, key, query);
      if (report.truncated) throw new ConflictException('Narrow the date or branch filters before exporting.');
      await this.admin.audit(tx, actor, 'EXPORT', 'REPORT', undefined, { key, rows: report.rows.length });
      return report;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  private async reportData(tx: Prisma.TransactionClient, actor: AuthUserDto, key: string, query: ReportQuery): Promise<SuperAdminReport> {
    const hospitalId = this.admin.scope(actor), { timestamps, calendar } = range(query);
    if (!SUPER_ADMIN_REPORTS.some(([name]) => key === name)) throw new BadRequestException('Unknown report.');
    const ids = query.branchIds?.split(',').filter(Boolean);
    if (ids && (ids.length > 50 || ids.some(id => id.length > 128))) throw new BadRequestException('Invalid branch filter.');
    const branchFilter = ids?.length ? { in: ids } : undefined;
    const scoped = { hospitalId, branchId: branchFilter };
    const take = MAX + 1;
    const result = (headers: string[], rows: SuperAdminReport['rows']): SuperAdminReport =>
      ({ key, headers, rows: rows.slice(0, MAX), truncated: rows.length > MAX });
    switch (key) {
      case 'branch-performance':
      case 'branch-comparison': {
        const branches = await tx.branch.findMany({ where: { hospitalId, deletedAt: null, id: branchFilter },
          select: { id: true, code: true, name: true }, orderBy: { code: 'asc' }, take });
        const branchId = { in: branches.map(branch => branch.id) };
        const [bookings, admissions, registrations, payments] = await Promise.all([
          tx.appointment.groupBy({ by: ['branchId'], where: { hospitalId, branchId, appointmentDate: calendar }, _count: { _all: true } }),
          tx.admission.groupBy({ by: ['branchId'], where: { hospitalId, branchId, admittedAt: timestamps }, _count: { _all: true } }),
          tx.patient.groupBy({ by: ['registrationBranchId'], where: { hospitalId, registrationBranchId: branchId, createdAt: timestamps, deletedAt: null }, _count: { _all: true } }),
          tx.payment.groupBy({ by: ['branchId'], where: { hospitalId, branchId, createdAt: timestamps }, _sum: { amount: true } }),
        ]);
        return result(['Code', 'Branch', 'New registrations', 'Appointments', 'Admissions', 'Payments received (INR)'],
          branches.map(b => [b.code, b.name, registrations.find(r => r.registrationBranchId === b.id)?._count._all ?? 0,
            bookings.find(r => r.branchId === b.id)?._count._all ?? 0, admissions.find(r => r.branchId === b.id)?._count._all ?? 0,
            payments.find(r => r.branchId === b.id)?._sum.amount?.toFixed(2) ?? '0.00']));
      }
      case 'branch-creation': {
        const rows = await tx.branch.findMany({ where: { hospitalId, deletedAt: null, id: branchFilter, createdAt: timestamps },
          orderBy: { createdAt: 'desc' }, take, select: { code: true, name: true, city: true, licenseNumber: true, createdAt: true, isActive: true } });
        return result(['Code', 'Branch', 'City', 'Licence', 'Created at', 'Status'],
          rows.map(row => [row.code, row.name, row.city, row.licenseNumber, stamp(row.createdAt), row.isActive ? 'Active' : 'Inactive']));
      }
      case 'hospital-admins':
      case 'users': {
        const rows = await tx.user.findMany({
          where: { ...scoped, deletedAt: null, createdAt: timestamps,
            userRoles: key === 'hospital-admins' ? { some: { role: { name: 'HOSPITAL_ADMIN' } } } : undefined },
          orderBy: { createdAt: 'desc' }, take,
          select: { firstName: true, lastName: true, isActive: true, createdAt: true, branch: { select: { name: true } },
            userRoles: { select: { role: { select: { name: true } } } } },
        });
        return result(['Name', 'Roles', 'Branch', 'Status', 'Created at'], rows.map(row =>
          [row.firstName + ' ' + row.lastName, row.userRoles.map(link => link.role.name).join(', '), row.branch?.name ?? null, row.isActive ? 'Active' : 'Inactive', stamp(row.createdAt)]));
      }
      case 'account-status': {
        const rows = await tx.user.groupBy({ by: ['isActive'], where: { ...scoped, deletedAt: null, createdAt: timestamps }, _count: { _all: true } });
        return result(['Status', 'Accounts created in period'], rows.map(row => [row.isActive ? 'Active' : 'Inactive', row._count._all]));
      }
      case 'employees': {
        const rows = await tx.employee.findMany({ where: { ...scoped, dateOfJoining: timestamps }, take, orderBy: { dateOfJoining: 'desc' },
          select: { employeeCode: true, designation: true, dateOfJoining: true, status: true, branch: { select: { name: true } }, department: { select: { name: true } } } });
        return result(['Employee code', 'Designation', 'Branch', 'Department', 'Joined', 'Status'],
          rows.map(row => [row.employeeCode, row.designation, row.branch?.name ?? null, row.department?.name ?? null, stamp(row.dateOfJoining), row.status]));
      }
      case 'doctors': {
        const rows = await tx.doctor.findMany({ where: scoped, take, orderBy: { id: 'asc' },
          select: { specialization: true, department: { select: { name: true } }, branch: { select: { name: true } },
            employee: { select: { employeeCode: true } }, _count: { select: { appointments: { where: { hospitalId, appointmentDate: calendar } } } } } });
        return result(['Doctor code', 'Specialization', 'Branch', 'Department', 'Appointments'],
          rows.map(row => [row.employee.employeeCode, row.specialization, row.branch.name, row.department.name, row._count.appointments]));
      }
      case 'departments': {
        const rows = await tx.department.findMany({ where: { ...scoped, deletedAt: null }, take, orderBy: { code: 'asc' },
          select: { code: true, name: true, branch: { select: { name: true } },
            wards: { where: { hospitalId }, select: { totalBeds: true, occupiedBeds: true,
              _count: { select: { admissions: { where: { hospitalId, admittedAt: timestamps } } } } } } } });
        return result(['Code', 'Department', 'Branch', 'Current beds', 'Current occupied', 'Admissions in period'],
          rows.map(row => [row.code, row.name, row.branch?.name ?? null, row.wards.reduce((n, w) => n + w.totalBeds, 0),
            row.wards.reduce((n, w) => n + w.occupiedBeds, 0), row.wards.reduce((n, w) => n + w._count.admissions, 0)]));
      }
      case 'patient-registration': {
        const rows = await tx.patient.findMany({ where: { hospitalId, deletedAt: null, registrationBranchId: branchFilter, createdAt: timestamps },
          take, orderBy: { createdAt: 'desc' }, select: { uhid: true, createdAt: true, registrationBranch: { select: { name: true } } } });
        return result(['UHID', 'Registration branch', 'Registered at'], rows.map(row => [row.uhid, row.registrationBranch.name, stamp(row.createdAt)]));
      }
      case 'appointments': {
        const rows = await tx.appointment.groupBy({ by: ['status'], where: { ...scoped, appointmentDate: calendar }, _count: { _all: true } });
        return result(['Appointment status', 'Count'], rows.map(row => [row.status, row._count._all]));
      }
      case 'revenue': {
        const rows = await tx.payment.groupBy({ by: ['paymentMethod'], where: { ...scoped, createdAt: timestamps }, _sum: { amount: true }, _count: { _all: true } });
        return result(['Payment method', 'Receipts', 'Payments received (INR)'],
          rows.map(row => [row.paymentMethod, row._count._all, row._sum.amount?.toFixed(2) ?? '0.00']));
      }
      case 'user-activity':
      case 'organization-activity': {
        if (!actor.permissions.includes('AUDIT_LOGS:VIEW') && !actor.permissions.includes('AUDIT_LOGS:EXPORT')) {
          throw new BadRequestException('Audit permission is required for this report.');
        }
        const rows = await tx.auditLog.findMany({ where: { ...scoped, createdAt: timestamps,
          resource: key === 'organization-activity' ? { in: ['HOSPITAL', 'BRANCH', 'DEPARTMENT', 'ROLE_POLICY', 'MASTER_DATA'] } : undefined },
          take, orderBy: { createdAt: 'desc' }, select: { action: true, resource: true, userEmail: true, createdAt: true } });
        return result(['Action', 'Resource', 'Actor', 'Timestamp'], rows.map(row => [row.action, row.resource, row.userEmail, stamp(row.createdAt)]));
      }
      default: throw new BadRequestException('Unknown report.');
    }
  }
}
