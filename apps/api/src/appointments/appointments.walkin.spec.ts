import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AppointmentSource, AppointmentType, AuthUserDto, Priority, Role } from '@multispeciality-hms/contracts';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppointmentsService Walk-in Booking & Synchronization', () => {
  const hospitalId = 'hosp-1';
  const branchId = 'branch-1';
  const deptId = 'dept-1';
  const doctorId = 'doc-1';
  const patientId = 'pat-1';

  const receptionist: AuthUserDto = {
    id: 'rec-user-1',
    email: 'reception@uyirinai.com',
    firstName: 'Priya',
    lastName: 'Dharshini',
    role: Role.RECEPTIONIST,
    roles: [Role.RECEPTIONIST],
    permissions: ['APPOINTMENTS:VIEW', 'APPOINTMENTS:CREATE', 'APPOINTMENTS:UPDATE', 'PATIENTS:VIEW', 'DOCTORS:VIEW'],
    hospitalId,
    branchId,
    employeeCode: 'EMP-REC-001',
  };

  function setupMock() {
    const futureDate = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const dayOfWeek = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(futureDate + 'T00:00:00Z'))
      .toUpperCase();

    const db: any = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({
          id: doctorId,
          hospitalId,
          branchId,
          departmentId: deptId,
          consultationDurationMin: 15,
          consultationFee: 500,
          employee: { userId: 'doc-user-1' },
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: doctorId,
          branchId,
          consultationDurationMin: 15,
        }),
      },
      patient: {
        findFirst: jest.fn().mockResolvedValue({
          id: patientId,
          userId: 'pat-user-1',
          firstName: 'Arun',
          lastName: 'Kumar',
          uhid: 'KZN-2026-0099',
        }),
      },
      appointmentRequest: {
        findFirst: jest.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(3),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'apt-new-1',
          ...data,
          patient: { id: patientId, uhid: 'KZN-2026-0099', firstName: 'Arun', lastName: 'Kumar', phone: '9876543210', email: 'arun@test.com' },
          department: { id: deptId, name: 'Cardiology', code: 'CARD' },
          branch: { id: branchId, name: 'Main Branch', address: '123 Road', city: 'Madurai', phone: '0452-1111', hospital: { id: hospitalId, name: 'Uyirinai Hospital' } },
          doctor: {
            employee: { user: { firstName: 'Senthil', lastName: 'Nathan' } },
            department: { id: deptId, name: 'Cardiology', code: 'CARD' },
          },
        })),
      },
      doctorSchedule: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'sched-1', dayOfWeek, startTime: '09:00', endTime: '12:00', maxPatients: 10, isActive: true },
        ]),
      },
      doctorLeave: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      $transaction: jest.fn(),
    };
    db.$transaction.mockImplementation((cb: any) => cb(db));
    return { db, futureDate, dayOfWeek, service: new AppointmentsService(db as unknown as PrismaService) };
  }

  it('books a walk-in appointment, sets RECEPTION_WALK_IN source, assigns token, and notifies both doctor and patient', async () => {
    const { db, futureDate, service } = setupMock();
    db.appointment.findMany.mockResolvedValueOnce([
      { patientId: 'other-pat', appointmentTime: '09:00', tokenNumber: 2, status: 'SCHEDULED' },
    ]);

    const created = await service.create(
      {
        patientId,
        doctorId,
        departmentId: deptId,
        hospitalId,
        branchId,
        appointmentDate: futureDate,
        appointmentTime: '09:30',
        appointmentType: AppointmentType.OPD,
        reasonForVisit: 'Chest discomfort review',
        priority: Priority.ROUTINE,
      },
      receptionist,
    );

    expect(created.source).toBe(AppointmentSource.RECEPTION_WALK_IN);
    expect(created.tokenNumber).toBe(3);
    expect(created.appointmentNumber).toMatch(/^APT-\d{4}-0004$/);
    expect(db.notification.create).toHaveBeenCalledTimes(2);
    expect(db.notification.create.mock.calls[0][0].data.userId).toBe('doc-user-1');
    expect(db.notification.create.mock.calls[1][0].data.userId).toBe('pat-user-1');
  });

  it('marks appointments created from a patient request as ONLINE_PATIENT', async () => {
    const { db, futureDate, service } = setupMock();
    const requestId = '11111111-1111-1111-1111-111111111111';

    const created = await service.create(
      {
        requestId,
        patientId,
        doctorId,
        departmentId: deptId,
        hospitalId,
        branchId,
        appointmentDate: futureDate,
        appointmentTime: '10:00',
        appointmentType: AppointmentType.OPD,
        reasonForVisit: 'Follow-up check',
      },
      receptionist,
    );

    expect(created.source).toBe(AppointmentSource.ONLINE_PATIENT);
    expect(db.appointmentRequest.updateMany).toHaveBeenCalled();
  });

  it('prevents double-booking or overlapping walk-in time slots', async () => {
    const { db, futureDate, service } = setupMock();
    db.appointment.findMany.mockResolvedValueOnce([
      { patientId: 'other-pat', appointmentTime: '09:30', tokenNumber: 1, status: 'SCHEDULED' },
    ]);

    await expect(
      service.create(
        {
          patientId,
          doctorId,
          departmentId: deptId,
          hospitalId,
          branchId,
          appointmentDate: futureDate,
          appointmentTime: '09:35',
          appointmentType: AppointmentType.OPD,
          reasonForVisit: 'Routine',
        },
        receptionist,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('prevents booking when doctor is on approved leave', async () => {
    const { db, futureDate, service } = setupMock();
    db.doctorLeave.findFirst.mockResolvedValueOnce({ id: 'leave-1' });

    await expect(
      service.create(
        {
          patientId,
          doctorId,
          departmentId: deptId,
          hospitalId,
          branchId,
          appointmentDate: futureDate,
          appointmentTime: '10:00',
          appointmentType: AppointmentType.OPD,
          reasonForVisit: 'Walk-in visit',
        },
        receptionist,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('computes doctor slot availability and flags booked slots as unavailable', async () => {
    const { db, futureDate, service } = setupMock();
    db.appointment.findMany.mockResolvedValueOnce([{ appointmentTime: '09:15' }]);

    const availability = await service.getAvailableSlots(receptionist, doctorId, futureDate, branchId);
    const slot0900 = availability.slots.find((s) => s.time === '09:00');
    const slot0915 = availability.slots.find((s) => s.time === '09:15');

    expect(availability.isOnLeave).toBe(false);
    expect(slot0900?.available).toBe(true);
    expect(slot0915?.available).toBe(false);
    expect(slot0915?.reason).toBe('BOOKED');
  });

  it('forbids patient role from directly creating an appointment outside request flow', async () => {
    const { futureDate, service } = setupMock();
    const patientActor: AuthUserDto = {
      id: 'pat-user-1',
      email: 'p@test.com',
      firstName: 'A',
      lastName: 'B',
      role: Role.PATIENT,
      roles: [Role.PATIENT],
      permissions: [],
      hospitalId,
      patientProfileId: patientId,
    };

    await expect(
      service.create(
        {
          patientId,
          doctorId,
          departmentId: deptId,
          hospitalId,
          appointmentDate: futureDate,
          appointmentTime: '10:00',
          appointmentType: AppointmentType.OPD,
          reasonForVisit: 'Direct test',
        },
        patientActor,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects malformed slot queries cleanly', async () => {
    const { service } = setupMock();
    await expect(service.getAvailableSlots(receptionist, doctorId, 'not-a-date')).rejects.toThrow(
      BadRequestException,
    );
  });
});
