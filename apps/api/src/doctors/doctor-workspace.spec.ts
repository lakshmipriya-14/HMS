import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { ConsultationsService } from '../consultations/consultations.service';
import { resolveClinicalOrderScope } from '../common/utils/clinical-order-scope';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorsService } from './doctors.service';

const actor = {
  id: 'user', email: 'doctor@example.test', role: Role.DOCTOR, hospitalId: 'hospital',
  branchId: 'branch', departmentId: 'department', doctorProfileId: 'doctor', permissions: [],
} as unknown as AuthUserDto;

const dto = {
  appointmentId: 'appointment', doctorId: 'doctor', patientId: 'patient',
  chiefComplaint: 'Reported symptom', diagnosisNotes: 'Documented assessment', treatmentPlan: 'Follow-up plan',
};

describe('Doctor workspace boundaries', () => {
  it('denies self-workspace reads to a different active role before querying', async () => {
    const findFirst = jest.fn();
    const prisma = { doctor: { findFirst } } as unknown as PrismaService;
    await expect(new DoctorsService(prisma).workspace({ ...actor, role: Role.PATIENT }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('denies orders that claim another doctor before querying', async () => {
    await expect(resolveClinicalOrderScope({} as PrismaService, actor, 'other-doctor', 'patient'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a round note for an admission outside the doctor assignment', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const create = jest.fn();
    const tx = { admission: { findFirst }, auditLog: { create } };
    const prisma = { $transaction: (callback: (db: typeof tx) => unknown) => callback(tx) } as unknown as PrismaService;
    await expect(new DoctorsService(prisma).recordProgressNote({
      admissionId: 'other-admission', progressNote: 'Documented observations',
    }, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      hospitalId: actor.hospitalId, branchId: actor.branchId, admittingDoctorId: actor.doctorProfileId, status: 'ADMITTED',
    }) }));
    expect(create).not.toHaveBeenCalled();
  });

  it('links an accepted round note to the doctor, branch, and admission in the audit log', async () => {
    const create = jest.fn().mockResolvedValue({ createdAt: new Date('2026-11-26T00:00:00Z') });
    const tx = {
      admission: { findFirst: jest.fn().mockResolvedValue({ id: 'admission', branchId: actor.branchId,
        patient: { firstName: 'Demo', lastName: 'Patient' } }) },
      auditLog: { create },
    };
    const prisma = { $transaction: (callback: (db: typeof tx) => unknown) => callback(tx) } as unknown as PrismaService;
    await expect(new DoctorsService(prisma).recordProgressNote({
      admissionId: 'admission', progressNote: ' Documented observations ',
    }, actor)).resolves.toMatchObject({ admissionId: 'admission', progressNote: 'Documented observations' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      hospitalId: actor.hospitalId, branchId: actor.branchId, userId: actor.id,
      action: 'DOCTOR_ROUND', resource: 'ADMISSION', resourceId: 'admission',
    }) }));
  });

  it('denies finalization if the appointment does not exist in the doctor scope', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const tx = { appointment: { findFirst } };
    const prisma = { $transaction: (callback: (db: typeof tx) => unknown) => callback(tx) } as unknown as PrismaService;
    await expect(new ConsultationsService(prisma).create(dto, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith({ where: {
      id: dto.appointmentId, doctorId: actor.doctorProfileId, hospitalId: actor.hospitalId,
      branchId: actor.branchId, departmentId: actor.departmentId,
    } });
  });

  it('does not create a second consultation if the appointment cannot transition', async () => {
    const create = jest.fn();
    const tx = {
      appointment: {
        findFirst: jest.fn().mockResolvedValue({ id: dto.appointmentId, patientId: dto.patientId, doctorId: dto.doctorId }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      consultation: { create },
    };
    const prisma = { $transaction: (callback: (db: typeof tx) => unknown) => callback(tx) } as unknown as PrismaService;
    await expect(new ConsultationsService(prisma).create(dto, actor)).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });
});
