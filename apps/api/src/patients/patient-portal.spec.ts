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
  });
});
