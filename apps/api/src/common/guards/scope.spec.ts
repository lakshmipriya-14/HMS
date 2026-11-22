import { ForbiddenException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthUserDto, Role, PaymentMethod, TripStatus } from '@multispeciality-hms/contracts';
import {
  resolveOperationalScope,
  assertBranchAccess,
  assertDepartmentAccess,
} from '../utils/operational-scope';
import { appointmentReadScope } from '../../appointments/appointments.service';
import { resolveAccess } from '../../auth/access-context';
import { PatientsService } from '../../patients/patients.service';
import { PharmacyService } from '../../pharmacy/pharmacy.service';
import { LaboratoryService } from '../../laboratory/laboratory.service';
import { BillingService } from '../../billing/billing.service';
import { AmbulanceService } from '../../ambulance/ambulance.service';
import { SuperAdminController } from '../../super-admin/super-admin.controller';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Prisma } from '@prisma/client';

describe('Scope Architecture & Branch Isolation Specifications (Phase 1B Security Review)', () => {
  const hospitalId = 'ca62eaa5-77b0-4691-9086-86f8e009757b';
  const chennaiBranchId = 'ff97a266-86e1-405d-9ae0-78848ffca213';
  const maduraiBranchId = 'd10d88bb-9986-46c8-9dfb-ce2ef410d514';
  const cardioDeptId = 'f8ce844b-d6c4-414f-891f-3f70ece4a534';
  const neuroDeptId = 'dd3453b5-8f54-4493-a3f7-fe5a6ec33d52';

  const superAdmin: AuthUserDto = {
    id: 'super-admin-id',
    email: 'superadmin@uyirinai.com',
    firstName: 'Super',
    lastName: 'Admin',
    hospitalId,
    role: Role.SUPER_ADMIN,
    permissions: ['*'],
  };

  const chennaiHospitalAdmin: AuthUserDto = {
    id: 'admin-chennai-id',
    email: 'admin.chennai@uyirinai.com',
    firstName: 'Chennai',
    lastName: 'Admin',
    hospitalId,
    role: Role.HOSPITAL_ADMIN,
    branchId: chennaiBranchId,
    permissions: ['USERS:VIEW', 'REPORTS:VIEW', 'AUDIT_LOGS:VIEW'],
  };

  const maduraiHospitalAdmin: AuthUserDto = {
    id: 'admin-madurai-id',
    email: 'admin.madurai@uyirinai.com',
    firstName: 'Madurai',
    lastName: 'Admin',
    hospitalId,
    role: Role.HOSPITAL_ADMIN,
    branchId: maduraiBranchId,
    permissions: ['USERS:VIEW', 'REPORTS:VIEW', 'AUDIT_LOGS:VIEW'],
  };

  const chennaiCardioDeptAdmin: AuthUserDto = {
    id: 'admin-cardio-id',
    email: 'admin.cardio@uyirinai.com',
    firstName: 'Cardio',
    lastName: 'Admin',
    hospitalId,
    role: Role.DEPARTMENT_ADMIN,
    branchId: chennaiBranchId,
    departmentId: cardioDeptId,
    permissions: ['USERS:VIEW', 'DEPARTMENTS:VIEW'],
  };

  const doctorChennai: AuthUserDto = {
    id: 'dr-chennai-id',
    email: 'dr.arun@uyirinai.com',
    firstName: 'Arun',
    lastName: 'Doctor',
    hospitalId,
    role: Role.DOCTOR,
    branchId: chennaiBranchId,
    departmentId: cardioDeptId,
    doctorProfileId: 'doc-profile-1',
    permissions: ['APPOINTMENTS:VIEW'],
  };

  const operationalStaffWithoutBranch: AuthUserDto = {
    id: 'nurse-unassigned-id',
    email: 'nurse.unassigned@uyirinai.com',
    firstName: 'Unassigned',
    lastName: 'Nurse',
    hospitalId,
    role: Role.NURSE,
    permissions: ['PATIENTS:VIEW'],
  };

  describe('Core Access Rules & Scoping', () => {
    it('1. Super Admin organization-wide access (no branch or department restriction)', () => {
      const scope = resolveOperationalScope(superAdmin);
      expect(scope.hospitalId).toBe(hospitalId);
      expect(scope.branchId).toBeUndefined();
      expect(scope.departmentId).toBeUndefined();

      const where = appointmentReadScope(superAdmin);
      expect(where).toEqual({ hospitalId });
      expect(where.branchId).toBeUndefined();

      expect(() => assertBranchAccess(superAdmin, chennaiBranchId)).not.toThrow();
      expect(() => assertBranchAccess(superAdmin, maduraiBranchId)).not.toThrow();
    });

    it('2. Super Admin branch filtering (can explicitly filter by branch without error)', () => {
      const scopeChennai = resolveOperationalScope(superAdmin, chennaiBranchId);
      expect(scopeChennai).toEqual({
        hospitalId,
        branchId: chennaiBranchId,
        departmentId: undefined,
      });

      const where = appointmentReadScope(superAdmin, chennaiBranchId);
      expect(where).toEqual({ hospitalId, branchId: chennaiBranchId });
    });

    it('3. Chennai admin reads Chennai records successfully', () => {
      const scope = resolveOperationalScope(chennaiHospitalAdmin);
      expect(scope).toEqual({
        hospitalId,
        branchId: chennaiBranchId,
        departmentId: undefined,
      });
      expect(() => assertBranchAccess(chennaiHospitalAdmin, chennaiBranchId)).not.toThrow();
    });

    it('4. Chennai admin cannot read a Madurai record by ID (403)', () => {
      expect(() => resolveOperationalScope(chennaiHospitalAdmin, maduraiBranchId)).toThrow(
        ForbiddenException
      );
      expect(() => assertBranchAccess(chennaiHospitalAdmin, maduraiBranchId)).toThrow(
        'Access denied to other branch records.'
      );
    });

    it('5. Madurai admin cannot access Chennai records (403)', () => {
      expect(() => resolveOperationalScope(maduraiHospitalAdmin, chennaiBranchId)).toThrow(
        ForbiddenException
      );
      expect(() => assertBranchAccess(maduraiHospitalAdmin, chennaiBranchId)).toThrow(
        'Access denied to other branch records.'
      );
    });

    it('6. Department Admin cannot access another department records in same branch (403)', () => {
      expect(() =>
        resolveOperationalScope(chennaiCardioDeptAdmin, undefined, neuroDeptId)
      ).toThrow('Access denied to other department records.');
      expect(() =>
        assertDepartmentAccess(chennaiCardioDeptAdmin, chennaiBranchId, neuroDeptId)
      ).toThrow('Access denied to another department.');
    });

    it('7. Department Admin cannot access another branch (403)', () => {
      expect(() =>
        resolveOperationalScope(chennaiCardioDeptAdmin, maduraiBranchId)
      ).toThrow('Access denied to other branch records.');
      expect(() => assertBranchAccess(chennaiCardioDeptAdmin, maduraiBranchId)).toThrow(
        ForbiddenException
      );
      expect(() =>
        assertDepartmentAccess(chennaiCardioDeptAdmin, maduraiBranchId, cardioDeptId)
      ).toThrow('Access denied to department of another branch.');
    });

    it('8. Client-supplied branchId cannot widen access (tamper resistance)', () => {
      expect(() =>
        resolveOperationalScope(chennaiHospitalAdmin, maduraiBranchId)
      ).toThrow(ForbiddenException);
      expect(() =>
        resolveOperationalScope(chennaiCardioDeptAdmin, maduraiBranchId)
      ).toThrow(ForbiddenException);
    });

    it('9. Operational user with null branch rejected (fail-closed)', () => {
      expect(() => resolveOperationalScope(operationalStaffWithoutBranch)).toThrow(
        'Operational staff requires branch scope.'
      );
      expect(() => appointmentReadScope(operationalStaffWithoutBranch)).toThrow(
        'Operational staff requires branch scope.'
      );
    });

    it('10. Hospital Admin with department scope is rejected', () => {
      const invalid: AuthUserDto = { ...chennaiHospitalAdmin, departmentId: cardioDeptId };
      expect(() => resolveOperationalScope(invalid)).toThrow(
        'Hospital Admin must not have department scope.'
      );
    });
  });

  describe('Department Admin Strict Branch Matching (No Global Bypass)', () => {
    it('rejects Department Admin access if department branchId is null or missing', () => {
      expect(() =>
        assertDepartmentAccess(chennaiCardioDeptAdmin, null, cardioDeptId)
      ).toThrow('Access denied to department of another branch.');
      expect(() =>
        assertDepartmentAccess(chennaiCardioDeptAdmin, undefined, cardioDeptId)
      ).toThrow('Access denied to department of another branch.');
    });

    it('rejects Department Admin access if department belongs to another branch', () => {
      expect(() =>
        assertDepartmentAccess(chennaiCardioDeptAdmin, maduraiBranchId, cardioDeptId)
      ).toThrow('Access denied to department of another branch.');
    });
  });

  describe('Export Security & Super Admin Controller Access', () => {
    it('SuperAdminController is strictly restricted to Role.SUPER_ADMIN at class level', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, SuperAdminController);
      expect(roles).toEqual([Role.SUPER_ADMIN]);
    });

    it('Chennai admin cannot access Super Admin export endpoint (role guard blocked)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, SuperAdminController);
      expect(roles.includes(chennaiHospitalAdmin.role)).toBe(false);
      expect(roles.includes(Role.HOSPITAL_ADMIN)).toBe(false);
    });
  });

  describe('Patient Ownership & Nested Record Branch Isolation', () => {
    it('filters nested relations by actor branch when Hospital Admin views patient details', async () => {
      let capturedArgs: any;
      const prismaMock = {
        patient: {
          findFirst: jest.fn(async (args) => {
            capturedArgs = args;
            return {
              id: 'pat-1',
              firstName: 'Test',
              lastName: 'Patient',
              registrationBranchId: chennaiBranchId,
              appointments: [],
              admissions: [],
              invoices: [],
              prescriptions: [],
            };
          }),
        },
      } as any;

      const service = new PatientsService(prismaMock);
      await service.findOne('pat-1', chennaiHospitalAdmin);

      // Verify patient findFirst scoped to actor's branch relations
      expect(capturedArgs.where.OR).toEqual([
        { registrationBranchId: chennaiBranchId },
        { appointments: { some: { branchId: chennaiBranchId } } },
        { admissions: { some: { branchId: chennaiBranchId } } },
      ]);

      // Verify nested relations strictly filtered to Chennai branch only
      expect(capturedArgs.include.appointments.where).toEqual({ branchId: chennaiBranchId });
      expect(capturedArgs.include.admissions.where).toEqual({ branchId: chennaiBranchId });
      expect(capturedArgs.include.invoices.where).toEqual({ branchId: chennaiBranchId });
      expect(capturedArgs.include.prescriptions.where).toEqual({ branchId: chennaiBranchId });
    });

    it('Super Admin viewing patient details receives unfiltered nested relations', async () => {
      let capturedArgs: any;
      const prismaMock = {
        patient: {
          findFirst: jest.fn(async (args) => {
            capturedArgs = args;
            return {
              id: 'pat-1',
              firstName: 'Test',
              lastName: 'Patient',
              registrationBranchId: chennaiBranchId,
              appointments: [],
            };
          }),
        },
      } as any;

      const service = new PatientsService(prismaMock);
      await service.findOne('pat-1', superAdmin);

      expect(capturedArgs.where.OR).toBeUndefined();
      expect(capturedArgs.include.appointments.where).toBeUndefined();
      expect(capturedArgs.include.admissions.where).toBeUndefined();
      expect(capturedArgs.include.invoices.where).toBeUndefined();
    });

    it('throws NotFoundException if patient does not belong to Hospital Admin branch', async () => {
      const prismaMock = {
        patient: {
          findFirst: jest.fn(async () => null),
        },
      } as any;

      const service = new PatientsService(prismaMock);
      await expect(service.findOne('pat-madurai', chennaiHospitalAdmin)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Pharmacy Module Branch Isolation', () => {
    it('scopes medicine stock batches to actor branch', async () => {
      let capturedArgs: any;
      const prismaMock = {
        medicine: {
          findMany: jest.fn(async (args) => {
            capturedArgs = args;
            return [];
          }),
        },
      } as any;

      const service = new PharmacyService(prismaMock);
      await service.getMedicines(chennaiHospitalAdmin);

      expect(capturedArgs.include.batches.where).toEqual({
        quantity: { gt: 0 },
        branchId: chennaiBranchId,
      });
    });

    it('scopes dispense queue to actor branch', async () => {
      let capturedArgs: any;
      const prismaMock = {
        prescription: {
          findMany: jest.fn(async (args) => {
            capturedArgs = args;
            return [];
          }),
        },
      } as any;

      const service = new PharmacyService(prismaMock);
      await service.getDispenseQueue(chennaiHospitalAdmin);

      expect(capturedArgs.where.branchId).toBe(chennaiBranchId);
    });

    it('blocks dispensing medication from another branch batch', async () => {
      const prismaMock = {
        $transaction: jest.fn(async (cb) => cb(prismaMock)),
        prescription: {
          findUnique: jest.fn(async () => ({
            id: 'presc-1',
            branchId: chennaiBranchId,
            hospitalId,
          })),
        },
        medicineBatch: {
          findUnique: jest.fn(async () => ({
            id: 'batch-madurai',
            branchId: maduraiBranchId, // Batch is in Madurai!
            quantity: 50,
          })),
        },
      } as any;

      const service = new PharmacyService(prismaMock);
      await expect(
        service.dispense(
          'presc-1',
          { prescriptionId: 'presc-1', pharmacistId: 'pharma-1', items: [{ batchId: 'batch-madurai', dispensedQuantity: 5, prescriptionItemId: 'pi-1' }] },
          'pharma-1',
          chennaiHospitalAdmin
        )
      ).rejects.toThrow('Selected medicine batch belongs to another branch');
    });

    it('blocks dispensing prescription from another branch (403)', async () => {
      const prismaMock = {
        $transaction: jest.fn(async (cb) => cb(prismaMock)),
        prescription: {
          findUnique: jest.fn(async () => ({
            id: 'presc-madurai',
            branchId: maduraiBranchId,
            hospitalId,
          })),
        },
      } as any;

      const service = new PharmacyService(prismaMock);
      await expect(
        service.dispense(
          'presc-madurai',
          { prescriptionId: 'presc-madurai', pharmacistId: 'pharma-1', items: [] },
          'pharma-1',
          chennaiHospitalAdmin
        )
      ).rejects.toThrow('Access denied to other branch records.');
    });
  });

  describe('Laboratory Module Branch Isolation', () => {
    it('scopes lab worklist to actor branch', async () => {
      let capturedArgs: any;
      const prismaMock = {
        labOrder: {
          findMany: jest.fn(async (args) => {
            capturedArgs = args;
            return [];
          }),
        },
      } as any;

      const service = new LaboratoryService(prismaMock);
      await service.getWorklist(chennaiHospitalAdmin);

      expect(capturedArgs.where.branchId).toBe(chennaiBranchId);
    });

    it('blocks collecting sample for lab order from another branch (403)', async () => {
      const prismaMock = {
        labOrder: {
          findUnique: jest.fn(async () => ({
            id: 'lab-madurai',
            branchId: maduraiBranchId,
          })),
        },
      } as any;

      const service = new LaboratoryService(prismaMock);
      await expect(
        service.collectSample('lab-madurai', 'BAR-123456', chennaiHospitalAdmin)
      ).rejects.toThrow('Access denied to other branch records.');
    });

    it('blocks entering results for lab order from another branch (403)', async () => {
      const prismaMock = {
        labOrder: {
          findUnique: jest.fn(async () => ({
            id: 'lab-madurai',
            branchId: maduraiBranchId,
          })),
        },
      } as any;

      const service = new LaboratoryService(prismaMock);
      await expect(
        service.enterResults({ orderId: 'lab-madurai', results: [] }, chennaiHospitalAdmin)
      ).rejects.toThrow('Access denied to other branch records.');
    });

    it('blocks releasing lab report from another branch (403)', async () => {
      const prismaMock = {
        labOrder: {
          findUnique: jest.fn(async () => ({
            id: 'lab-madurai',
            branchId: maduraiBranchId,
          })),
        },
      } as any;

      const service = new LaboratoryService(prismaMock);
      await expect(
        service.releaseReport('lab-madurai', 'user-1', chennaiHospitalAdmin)
      ).rejects.toThrow('Access denied to other branch records.');
    });
  });

  describe('Billing & Insurance Claims Branch Isolation', () => {
    it('scopes insurance claims to actor branch invoices', async () => {
      let capturedArgs: any;
      const prismaMock = {
        insuranceClaim: {
          findMany: jest.fn(async (args) => {
            capturedArgs = args;
            return [];
          }),
        },
      } as any;

      const service = new BillingService(prismaMock);
      await service.getInsuranceClaims(chennaiHospitalAdmin);

      expect(capturedArgs.where.invoice).toEqual({ branchId: chennaiBranchId });
    });

    it('blocks collecting payment on invoice belonging to another branch (403)', async () => {
      const prismaMock = {
        $transaction: jest.fn(async (cb) => cb(prismaMock)),
        invoice: {
          findUnique: jest.fn(async () => ({
            id: 'inv-madurai',
            branchId: maduraiBranchId,
            paidAmount: 0,
            totalAmount: 500,
          })),
        },
      } as any;

      const service = new BillingService(prismaMock);
      await expect(
        service.collectPayment(
          'inv-madurai',
          { invoiceId: 'inv-madurai', amount: 500, paymentMethod: PaymentMethod.CASH },
          'cashier-1',
          chennaiHospitalAdmin
        )
      ).rejects.toThrow('Access denied to other branch records.');
    });
  });

  describe('Ambulance Dispatch Branch Isolation', () => {
    it('scopes ambulance vehicles and active trips to actor branch', async () => {
      let capturedVehiclesArgs: any;
      let capturedTripsArgs: any;
      const prismaMock = {
        ambulance: {
          findMany: jest.fn(async (args) => {
            capturedVehiclesArgs = args;
            return [];
          }),
        },
        ambulanceTrip: {
          findMany: jest.fn(async (args) => {
            capturedTripsArgs = args;
            return [];
          }),
        },
      } as any;

      const service = new AmbulanceService(prismaMock);
      await service.getVehicles(chennaiHospitalAdmin);
      await service.getActiveTrips(chennaiHospitalAdmin);

      expect(capturedVehiclesArgs.where.branchId).toBe(chennaiBranchId);
      expect(capturedTripsArgs.where.branchId).toBe(chennaiBranchId);
    });

    it('blocks updating trip status belonging to another branch (403)', async () => {
      const prismaMock = {
        ambulanceTrip: {
          findUnique: jest.fn(async () => ({
            id: 'trip-madurai',
            branchId: maduraiBranchId,
          })),
        },
      } as any;

      const service = new AmbulanceService(prismaMock);
      await expect(
        service.updateTripStatus('trip-madurai', { status: TripStatus.HANDOVER_COMPLETE }, chennaiHospitalAdmin)
      ).rejects.toThrow('Access denied to other branch records.');
    });
  });

  describe('Access Context Authentication Resolution (resolveAccess)', () => {
    function mockDb(assignment: any, userOverrides: any = {}) {
      const user = {
        id: 'user-test-id',
        email: 'test@uyirinai.com',
        firstName: 'Test',
        lastName: 'User',
        hospitalId,
        patient: null,
        employee: null,
        userRoles: [assignment],
        ...userOverrides,
      };
      return {
        user: { findFirst: jest.fn(async () => user) },
        hospitalRolePolicy: { findUnique: jest.fn(async () => null) },
      } as unknown as Prisma.TransactionClient;
    }

    it('allows Super Admin with null branch and null department scope', async () => {
      const assignment = {
        hospitalId,
        roleId: 'super-admin-role-id',
        branchId: null,
        departmentId: null,
        branch: null,
        department: null,
        role: {
          name: Role.SUPER_ADMIN,
          rolePermissions: [{ permission: { resource: 'HOSPITAL', action: 'MANAGE' } }],
        },
      };
      const db = mockDb(assignment);
      const actor = await resolveAccess(db, 'user-test-id');
      expect(actor.role).toBe(Role.SUPER_ADMIN);
      expect(actor.branchId).toBeUndefined();
      expect(actor.departmentId).toBeUndefined();
    });

    it('rejects Super Admin with non-null branch scope (Invalid role scope)', async () => {
      const assignment = {
        hospitalId,
        roleId: 'super-admin-role-id',
        branchId: chennaiBranchId,
        departmentId: null,
        branch: { isActive: true, deletedAt: null },
        department: null,
        role: {
          name: Role.SUPER_ADMIN,
          rolePermissions: [],
        },
      };
      const db = mockDb(assignment);
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow('Invalid role scope.');
    });

    it('allows Hospital Admin with active branch and null department scope', async () => {
      const assignment = {
        hospitalId,
        roleId: 'hospital-admin-role-id',
        branchId: chennaiBranchId,
        departmentId: null,
        branch: { isActive: true, deletedAt: null },
        department: null,
        role: {
          name: Role.HOSPITAL_ADMIN,
          rolePermissions: [{ permission: { resource: 'BRANCH', action: 'VIEW' } }],
        },
      };
      const db = mockDb(assignment);
      const actor = await resolveAccess(db, 'user-test-id');
      expect(actor.role).toBe(Role.HOSPITAL_ADMIN);
      expect(actor.branchId).toBe(chennaiBranchId);
      expect(actor.departmentId).toBeUndefined();
    });

    it('rejects Hospital Admin with null branch scope (Invalid branch or department assignment)', async () => {
      const assignment = {
        hospitalId,
        roleId: 'hospital-admin-role-id',
        branchId: null,
        departmentId: null,
        branch: null,
        department: null,
        role: {
          name: Role.HOSPITAL_ADMIN,
          rolePermissions: [],
        },
      };
      const db = mockDb(assignment);
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        'Invalid branch or department assignment.'
      );
    });

    it('rejects Hospital Admin with non-null department scope', async () => {
      const assignment = {
        hospitalId,
        roleId: 'hospital-admin-role-id',
        branchId: chennaiBranchId,
        departmentId: cardioDeptId,
        branch: { isActive: true, deletedAt: null },
        department: { isActive: true, deletedAt: null, branchId: chennaiBranchId },
        role: {
          name: Role.HOSPITAL_ADMIN,
          rolePermissions: [],
        },
      };
      const db = mockDb(assignment);
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        'Invalid branch or department assignment.'
      );
    });

    it('allows Department Admin with active branch and active matching department', async () => {
      const assignment = {
        hospitalId,
        roleId: 'dept-admin-role-id',
        branchId: chennaiBranchId,
        departmentId: cardioDeptId,
        branch: { isActive: true, deletedAt: null },
        department: { isActive: true, deletedAt: null, branchId: chennaiBranchId },
        role: {
          name: Role.DEPARTMENT_ADMIN,
          rolePermissions: [],
        },
      };
      const db = mockDb(assignment);
      const actor = await resolveAccess(db, 'user-test-id');
      expect(actor.role).toBe(Role.DEPARTMENT_ADMIN);
      expect(actor.branchId).toBe(chennaiBranchId);
      expect(actor.departmentId).toBe(cardioDeptId);
    });

    it('rejects Department Admin if department belongs to a different branch', async () => {
      const assignment = {
        hospitalId,
        roleId: 'dept-admin-role-id',
        branchId: chennaiBranchId,
        departmentId: neuroDeptId,
        branch: { isActive: true, deletedAt: null },
        department: { isActive: true, deletedAt: null, branchId: maduraiBranchId },
        role: {
          name: Role.DEPARTMENT_ADMIN,
          rolePermissions: [],
        },
      };
      const db = mockDb(assignment);
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(resolveAccess(db, 'user-test-id')).rejects.toThrow(
        'Invalid branch or department assignment.'
      );
    });
  });
});
