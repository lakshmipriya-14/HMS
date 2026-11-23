import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { AppointmentRequestsService } from './appointment-requests.service';
import { PrismaService } from '../prisma/prisma.service';

const testUrl = process.env.APPOINTMENT_REQUEST_TEST_DATABASE_URL;
const postgresTest = testUrl ? describe : describe.skip;

postgresTest('appointment request persistence on an isolated test database', () => {
  it('commits one unassigned pending row and returns the same reference on retry', async () => {
    const url = new URL(testUrl!);
    if (!['kizuna_hms_test', 'uyirinai_hms_test'].includes(url.pathname.replace('/', ''))
      || !['postgresql:', 'postgres:'].includes(url.protocol)
      || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || [...url.searchParams.keys()].some(key => key !== 'schema')
      || url.searchParams.getAll('schema').some(schema => schema !== 'public')) {
      throw new Error('Use an isolated local kizuna_hms_test database.');
    }

    const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
    let reference: string | undefined;
    try {
      const [target] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
      if (!['kizuna_hms_test', 'uyirinai_hms_test'].includes(target?.db)) throw new Error('Unexpected test database.');
      const service = new AppointmentRequestsService(prisma as PrismaService);
      const suffix = [...randomBytes(12)].map(byte => String.fromCharCode(97 + byte % 26)).join('');
      const input = {
        patientName: 'Integration Visitor ' + suffix,
        phone: '+19990000000',
        specialty: 'Cardiology',
        preferredDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
      };
      ({ reference } = await service.submit(input));
      await expect(service.submit(input)).resolves.toEqual({ reference });
      await expect(prisma.appointmentRequest.findUnique({ where: { id: reference } })).resolves.toMatchObject({
        patientName: input.patientName,
        phone: input.phone,
        specialty: input.specialty,
        preferredDate: new Date(input.preferredDate + 'T00:00:00Z'),
        status: 'PENDING',
        branchId: null,
        patientId: null,
        appointmentId: null,
      });
      await expect(prisma.appointmentRequest.count({ where: { patientName: input.patientName } })).resolves.toBe(1);
    } finally {
      try {
        if (reference) await prisma.appointmentRequest.deleteMany({ where: { id: reference } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });
});
