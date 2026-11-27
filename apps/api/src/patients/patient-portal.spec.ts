import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PatientsService } from './patients.service';

const actor = { id: 'user-a', patientProfileId: 'patient-a', hospitalId: 'hospital-a', role: Role.PATIENT } as AuthUserDto;

describe('Patient portal', () => {
  function setup() {
    const empty = () => ({ findMany: jest.fn().mockResolvedValue([]) });
    const db = {
      patient: { findFirst: jest.fn().mockResolvedValue({ id: actor.patientProfileId }) },
      appointment: empty(), consultation: empty(), prescription: empty(), invoice: empty(), vitalsRecord: empty(),
      labOrder: { findMany: jest.fn().mockResolvedValue([{ id: 'lab-a' }]) },
      labResult: empty(),
      radiologyOrder: { findMany: jest.fn().mockResolvedValue([
        { id: 'draft', status: 'SCHEDULED', findings: 'Draft notes', impression: 'Draft' },
        { id: 'released', status: 'REPORT_RELEASED', reportReleasedAt: new Date(), findings: 'Released notes' },
      ]) },
      admission: { findMany: jest.fn().mockResolvedValue([{ id: 'admission', status: 'ADMITTED', dischargeSummary: 'Draft' }]) },
    };
    return { db, service: new PatientsService(db as unknown as PrismaService) };
  }

  it('requires the authenticated account to own the patient record', async () => {
    const { db, service } = setup();
    db.patient.findFirst.mockResolvedValue(null);
    await expect(service.portal(actor)).rejects.toThrow('Patient profile not found');
    expect(db.patient.findFirst.mock.calls[0][0].where).toEqual({
      id: 'patient-a', hospitalId: 'hospital-a', userId: 'user-a', deletedAt: null,
    });
    expect(db.appointment.findMany).not.toHaveBeenCalled();
  });

  it('rejects attempts to read another patient through the legacy detail route', async () => {
    const { service } = setup();
    await expect(service.findOne('patient-b', actor)).rejects.toThrow('Patient not found');
  });

  it('scopes related records and exposes only released reports and finalized discharge summaries', async () => {
    const { db, service } = setup();
    const data = await service.portal(actor);
    expect(db.appointment.findMany.mock.calls[0][0].where).toEqual({ patientId: 'patient-a', hospitalId: 'hospital-a' });
    expect(db.labResult.findMany.mock.calls[0][0].where.labOrder).toEqual({
      patientId: 'patient-a', hospitalId: 'hospital-a', id: { in: ['lab-a'] }, status: 'COMPLETED', reportReleasedAt: { not: null },
    });
    expect(data.radiology.map((row) => row.findings)).toEqual([null, 'Released notes']);
    expect(data.admissions[0].dischargeSummary).toBeNull();
    const expectedBranchSelect = {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        hospital: { select: { id: true, name: true } },
      },
    };
    expect(db.appointment.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.consultation.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.prescription.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.labOrder.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.radiologyOrder.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.invoice.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.admission.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.vitalsRecord.findMany.mock.calls[0][0].select.branch).toEqual(expectedBranchSelect);
    expect(db.invoice.findMany.mock.calls[0][0].select.appointment).toEqual({
      select: { id: true, appointmentNumber: true },
    });
    expect(db.invoice.findMany.mock.calls[0][0].select.payments.select).toMatchObject({
      id: true,
      amount: true,
      paymentMethod: true,
      transactionReference: true,
      paymentStatus: true,
      createdAt: true,
      branch: expectedBranchSelect,
    });
  });

  it('allows patient to cancel a receptionist-registered/checked-in appointment and notifies doctor, reception, department admin, and patient', async () => {
    const db: any = {
      patient: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'patient-a',
          userId: 'user-a',
          firstName: 'Asha',
          lastName: 'Rao',
          uhid: 'KZN-2026-0001',
        }),
      },
      appointment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'apt-walkin-1',
          appointmentNumber: 'APT-2026-0010',
          appointmentDate: new Date('2026-11-27T00:00:00Z'),
          appointmentTime: '13:15',
          status: 'CHECKED_IN',
          source: 'RECEPTION_WALK_IN',
          isPaid: false,
          hospitalId: 'hospital-a',
          branchId: 'branch-1',
          departmentId: 'dept-1',
          patient: { id: 'patient-a', userId: 'user-a', firstName: 'Asha', lastName: 'Rao', uhid: 'KZN-2026-0001' },
          department: { id: 'dept-1', name: 'General Medicine' },
          branch: { id: 'branch-1', name: 'Main Branch' },
          doctor: {
            consultationDurationMin: 15,
            employee: { userId: 'doc-user-1', user: { firstName: 'Demo', lastName: 'Doctor' } },
          },
        }),
        update: jest.fn().mockResolvedValue({ id: 'apt-walkin-1', status: 'CANCELLED' }),
      },
      user: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'rec-user-1' }])
          .mockResolvedValueOnce([{ id: 'dept-admin-1' }]),
      },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 4 }) },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
      $transaction: jest.fn(),
    };
    db.$transaction.mockImplementation((cb: any) => cb(db));
    const service = new PatientsService(db as unknown as PrismaService);

    const res = await service.changeAppointment(actor, 'apt-walkin-1', {
      action: 'cancel',
      reason: 'Unable to attend today',
    });

    expect(res).toEqual({ id: 'apt-walkin-1', status: 'CANCELLED' });
    const notifCall = db.notification.createMany.mock.calls[0][0].data;
    const recipientIds = notifCall.map((n: any) => n.userId);
    expect(recipientIds).toEqual(expect.arrayContaining(['doc-user-1', 'rec-user-1', 'dept-admin-1', 'user-a']));
    expect(notifCall[0].message).toContain('APT-2026-0010');
    expect(notifCall[0].message).toContain('Unable to attend today');
  });
});
