import { ArgumentMetadata, ExecutionContext, RequestMethod, ValidationPipe } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Prisma } from '@prisma/client';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { AppointmentRequestsService } from './appointment-requests.service';
import { PublicAppointmentRequestDto } from './public-appointment-request.dto';
import { PublicRequestRateGuard } from './public-request-rate.guard';
import { IS_PUBLIC_KEY } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

const input: PublicAppointmentRequestDto = {
  patientName: 'Test Visitor',
  phone: '98765 43210',
  specialty: 'Cardiology',
  preferredDate: '2026-11-22',
};
const scope = { hospitalId: 'hospital', branchId: 'branch' };

function setup() {
  const tx = {
    hospital: { findFirst: jest.fn().mockResolvedValue({ id: 'hospital' }) },
    appointmentRequest: {
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'reference' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue({ patientId: 'verified-patient' }),
    },
    patient: { findFirst: jest.fn().mockResolvedValue({ id: 'verified-patient' }), create: jest.fn() },
    appointment: { create: jest.fn() },
  };
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>, _options?: unknown) => callback(tx));
  const service = new AppointmentRequestsService({ $transaction: transaction } as unknown as PrismaService);
  return { tx, transaction, service };
}

describe('public appointment requests without a live database', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-21T20:00:00Z')); // November 22 in India.
  });
  afterEach(() => jest.useRealTimers());

  it('writes a hospital-scoped request and returns only the committed reference', async () => {
    const { service, tx, transaction } = setup();
    await expect(service.submit(input)).resolves.toEqual({ reference: 'reference' });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    expect(tx.hospital.findFirst).toHaveBeenCalledWith({
      where: { code: 'UYIRINAI', isActive: true, deletedAt: null }, select: { id: true },
    });
    expect(tx.appointmentRequest.create).toHaveBeenCalledWith({
      data: {
        hospitalId: 'hospital', patientName: 'Test Visitor', phone: '+919876543210',
        specialty: 'Cardiology', preferredDate: new Date('2026-11-22T00:00:00Z'), submissionKey: expect.any(String),
      },
      select: { id: true },
    });
    expect(tx.patient.create).not.toHaveBeenCalled();
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it.each(['patientName', 'phone'])('rejects a missing %s at the API boundary', async key => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metadata: ArgumentMetadata = { type: 'body', metatype: PublicAppointmentRequestDto };
    const payload = { ...input };
    delete payload[key];
    await expect(pipe.transform(payload, metadata)).rejects.toHaveProperty('status', 400);
  });

  it('discards visitor-supplied scope, identity links and status', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metadata: ArgumentMetadata = { type: 'body', metatype: PublicAppointmentRequestDto };
    const payload = await pipe.transform({
      ...input, hospitalId: 'other', branchId: 'other', patientId: 'other', appointmentId: 'other', status: 'BOOKED',
    }, metadata);
    expect(payload).toEqual(input);
  });

  it.each([
    { patientName: '   ' }, { phone: '12345' }, { phone: '+910987654321' },
    { preferredDate: '2026-02-30' }, { preferredDate: '2026-11-21' }, { preferredDate: '2027-03-01' },
    { preferredDate: '22-11-2026' }, { specialty: 'unlisted' },
  ])('rejects invalid input before a transaction: %p', async override => {
    const { service, transaction } = setup();
    await expect(service.submit({ ...input, ...override })).rejects.toHaveProperty('status', 400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('deduplicates normalized repeats including a serialization conflict', async () => {
    const { service, tx, transaction } = setup();
    const first = await service.submit(input);
    tx.appointmentRequest.findUnique.mockResolvedValue({ id: first.reference });
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(service.submit({ ...input, patientName: ' test  visitor ', phone: '+91 (98765) 43210' })).resolves.toEqual(first);
    const calls = tx.appointmentRequest.findUnique.mock.calls;
    expect(calls[0][0]).toEqual(calls[1][0]);
    expect(tx.appointmentRequest.create).toHaveBeenCalledTimes(1);
  });

  it('applies the persisted per-phone limit', async () => {
    const { service, tx } = setup();
    tx.appointmentRequest.count.mockResolvedValue(5);
    await expect(service.submit(input)).rejects.toHaveProperty('status', 429);
    expect(tx.appointmentRequest.create).not.toHaveBeenCalled();
  });

  it('does not return success if persistence or commit fails', async () => {
    const { service, tx, transaction } = setup();
    tx.appointmentRequest.create.mockRejectedValueOnce(new Error('private driver detail'));
    await expect(service.submit(input)).rejects.toMatchObject({
      status: 503, message: 'Could not save the request. Please retry with the same details.',
    });
    transaction.mockImplementationOnce(async callback => {
      await callback(tx);
      throw new Error('commit failed');
    });
    await expect(service.submit(input)).rejects.toHaveProperty('status', 503);
  });

  it('fails closed when the canonical hospital is not provisioned', async () => {
    const { service, tx } = setup();
    tx.hospital.findFirst.mockResolvedValue(null);
    await expect(service.submit(input)).rejects.toHaveProperty('status', 503);
    expect(tx.appointmentRequest.create).not.toHaveBeenCalled();
  });

  it('publishes only POST intake and limits repeated traffic per source', () => {
    const controller = AppointmentRequestsController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, AppointmentRequestsController)).toBe('public/appointment-requests');
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.submit)).toBe(true);
    const handlers = Object.getOwnPropertyNames(controller).filter(name =>
      Reflect.hasMetadata(METHOD_METADATA, controller[name]));
    expect(handlers).toEqual(['submit']);
    expect(Reflect.getMetadata(METHOD_METADATA, controller.submit)).toBe(RequestMethod.POST);

    const context = { switchToHttp: () => ({ getRequest: () => ({ ip: 'test-ip' }) }) } as ExecutionContext;
    const guard = new PublicRequestRateGuard();
    for (let i = 0; i < 8; i++) expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow('Too many requests');
    jest.advanceTimersByTime(60_000);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('links only an existing verified patient and allows an identical retry without creating patients', async () => {
    const { service, tx } = setup();
    await service.linkVerifiedPatient(scope, 'request', 'verified-patient');
    expect(tx.patient.findFirst).toHaveBeenCalledWith({
      where: { id: 'verified-patient', hospitalId: 'hospital', deletedAt: null }, select: { id: true },
    });
    expect(tx.appointmentRequest.updateMany).toHaveBeenCalledWith({
      where: { ...scope, id: 'request', status: 'PENDING', patientId: null },
      data: { patientId: 'verified-patient', status: 'PATIENT_LINKED' },
    });
    tx.appointmentRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.linkVerifiedPatient(scope, 'request', 'verified-patient')).resolves.toBeUndefined();
    tx.appointmentRequest.findFirst.mockResolvedValueOnce({ patientId: 'other-patient' });
    await expect(service.linkVerifiedPatient(scope, 'request', 'verified-patient')).rejects.toHaveProperty('status', 409);
    tx.patient.findFirst.mockResolvedValueOnce(null);
    await expect(service.linkVerifiedPatient(scope, 'request', 'unknown')).rejects.toHaveProperty('status', 404);
    expect(tx.patient.create).not.toHaveBeenCalled();
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });
});
