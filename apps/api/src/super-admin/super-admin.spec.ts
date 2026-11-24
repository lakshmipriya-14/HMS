import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminReadService } from './super-admin-read.service';
import { SuperAdminController } from './super-admin.controller';
import { PERMISSIONS_KEY, ROLES_KEY, SCOPED_KEY } from '../common/decorators/roles.decorator';

const actor = { id: 'admin', hospitalId: 'hospital', role: Role.SUPER_ADMIN, permissions: ['AUDIT_LOGS:VIEW'] } as AuthUserDto;
const branch = { name: 'North', code: 'north', address: 'North Road', city: 'City', phone: '9876543210' };

function fixture() {
  const tx = {
    branch: {
      create: jest.fn().mockResolvedValue({ id: 'branch', code: 'NORTH' }),
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit' }) },
    role: { findUnique: jest.fn().mockResolvedValue({ id: 'role', rolePermissions: [{ permission: { resource: 'USERS', action: 'VIEW' } }] }) },
    hospitalRolePolicy: { upsert: jest.fn().mockResolvedValue({ grants: [] }) },
    user: { findFirst: jest.fn().mockResolvedValue(null) },
    appointment: { groupBy: jest.fn().mockResolvedValue([{ status: 'SCHEDULED', _count: { _all: 2 } }]) },
  };
  const transaction = jest.fn((work: (client: typeof tx) => unknown) => work(tx));
  const prisma = { ...tx, $transaction: transaction } as unknown as PrismaService;
  const service = new SuperAdminService(prisma);
  return { tx, transaction, service, read: new SuperAdminReadService(prisma, service) };
}

describe('Super Admin boundaries', () => {
  it('denies Hospital Admin, Department Admin and branch users before a write', async () => {
    const { service, transaction } = fixture();
    for (const role of [Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN, Role.DOCTOR]) {
      await expect(service.createBranch({ ...actor, role }, branch)).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(transaction).not.toHaveBeenCalled();
  });

  it('reads branches only within the caller hospital and excludes deleted rows', async () => {
    const { service, tx } = fixture();
    await expect(service.branch(actor, 'other-hospital-branch')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.branch.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'other-hospital-branch', hospitalId: actor.hospitalId, deletedAt: null } }));
  });

  it('writes a canonical branch code and its audit event through one transaction', async () => {
    const { service, transaction, tx } = fixture();
    await expect(service.createBranch(actor, branch)).resolves.toEqual({ id: 'branch', code: 'NORTH' });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.branch.create).toHaveBeenCalledWith({ data: { ...branch, code: 'NORTH', hospitalId: actor.hospitalId } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ hospitalId: actor.hospitalId, branchId: 'branch', resourceId: 'branch' }) });
  });

  it('fails the branch operation if the append-only audit write fails', async () => {
    const { service, tx } = fixture();
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(service.createBranch(actor, branch)).rejects.toThrow('Audit unavailable');
  });

  it('soft-deletes a branch in the caller hospital and audits it in the same transaction', async () => {
    const { service, transaction, tx } = fixture();
    await expect(service.deleteBranch(actor, 'branch')).resolves.toEqual({ id: 'branch' });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.branch.updateMany).toHaveBeenCalledWith({
      where: { id: 'branch', hospitalId: actor.hospitalId, deletedAt: null },
      data: { isActive: false, deletedAt: expect.any(Date) },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: 'DELETE', resource: 'BRANCH', branchId: 'branch',
    }) });
    expect(Reflect.getMetadata(PERMISSIONS_KEY, SuperAdminController.prototype.deleteBranch))
      .toEqual(['HOSPITALS:DELETE']);
  });

  it('does not audit a delete when the branch is outside the caller hospital or already deleted', async () => {
    const { service, tx } = fixture();
    tx.branch.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.deleteBranch(actor, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('requires a department and a branch for Department Admin', async () => {
    const { service, transaction } = fixture();
    await expect(service.createAdministrator(actor, {
      role: Role.DEPARTMENT_ADMIN, firstName: 'Test', lastName: 'Staff', email: 'fixture@example.test',
      phone: '9876543210', employeeCode: 'TEST', dateOfJoining: '2026-11-21',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('keeps Super Admin policy protected and prevents adding grants outside role defaults', async () => {
    const { service, tx } = fixture();
    await expect(service.savePolicy(actor, Role.SUPER_ADMIN, [])).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.savePolicy(actor, Role.HOSPITAL_ADMIN, ['HOSPITALS:UPDATE'])).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.hospitalRolePolicy.upsert).not.toHaveBeenCalled();
    await expect(service.savePolicy(actor, Role.HOSPITAL_ADMIN, [])).resolves.toEqual({ grants: [] });
    expect(tx.hospitalRolePolicy.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { hospitalId_roleId: { hospitalId: actor.hospitalId, roleId: 'role' } },
    }));
  });

  it('uses a restricted report export grant and role on the controller', () => {
    expect(Reflect.getMetadata(SCOPED_KEY, SuperAdminController)).toBe(true);
    expect(Reflect.getMetadata(ROLES_KEY, SuperAdminController)).toEqual([Role.SUPER_ADMIN]);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, SuperAdminController.prototype.exportReport)).toEqual(['REPORTS:EXPORT']);
  });

  it('uses the hospital, selected branches and calendar dates for appointment reports and audits export', async () => {
    const { read, tx } = fixture();
    await expect(read.exportReport(actor, 'appointments', { from: '2026-11-20', to: '2026-11-21', branchIds: 'north' }))
      .resolves.toMatchObject({ rows: [['SCHEDULED', 2]], truncated: false });
    expect(tx.appointment.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: { hospitalId: actor.hospitalId, branchId: { in: ['north'] },
        appointmentDate: { gte: new Date('2026-11-20'), lt: new Date('2026-11-22') } },
    }));
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'EXPORT', resource: 'REPORT' }) });
  });

  it('rejects invalid report dates before querying or auditing', async () => {
    const { read, tx } = fixture();
    await expect(read.exportReport(actor, 'appointments', { from: '2026-02-30' })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.appointment.groupBy).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});
