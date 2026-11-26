import { PrismaClient } from '@prisma/client';
import { teamDatabaseUrl } from './team-database.mjs';

const prisma = new PrismaClient({ datasourceUrl: teamDatabaseUrl() });
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
const day = new Date(today + 'T00:00:00Z');
const tomorrow = new Date(day.getTime() + 86_400_000);
const cases = [
  { key: 'CHECKED-IN', status: 'CHECKED_IN', time: '11:30' },
  { key: 'DRAFT', status: 'IN_PROGRESS', time: '11:45' },
  { key: 'FINALIZED', status: 'COMPLETED', time: '12:00' },
  { key: 'CANCELLED', status: 'CANCELLED', time: '12:15' },
  { key: 'FOLLOW-UP', status: 'SCHEDULED', time: '11:30', future: true },
];

async function seed() {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(577901320)`;
    const [target] = await tx.$queryRaw`SELECT current_database() AS name, current_schema() AS schema`;
    if (!['uyirinai_hms_team', 'uyirinai_hms_new'].includes(target.name) || target.schema !== 'public') {
      throw new Error('Unexpected team database.');
    }

    let inserted = 0;
    for (let index = 1; index <= 5; index++) {
      const suffix = index === 1 ? '' : `-0${index}`;
      const source = await tx.appointment.findUnique({
        where: { appointmentNumber: `DEMO-APT-001${suffix}` },
        select: { hospitalId: true, branchId: true, doctorId: true, patientId: true, departmentId: true, consultation: { select: { id: true, status: true } },
          consultationFee: true, doctor: { select: { employee: { select: { userId: true, user: { select: { email: true } } } } } },
          patient: { select: { uhid: true } } },
      });
      if (!source || source.doctor.employee.user.email !== `doctor${suffix}@demo.uyirinai.test`
        || source.patient.uhid !== `DEMO-UHID-001${suffix}`) continue;

      const { doctor, patient, consultation, ...scope } = source;
      let createdForDoctor = 0;
      for (const fixture of cases) {
        const appointmentNumber = `DEMO-DR-${today}-${index}-${fixture.key}`;
        if (await tx.appointment.findUnique({ where: { appointmentNumber }, select: { id: true } })) continue;
        const appointmentDate = fixture.future ? tomorrow : day;
        const slot = { ...scope, appointmentDate };
        const last = await tx.appointment.findFirst({
          where: { hospitalId: scope.hospitalId, branchId: scope.branchId, doctorId: scope.doctorId, appointmentDate },
          orderBy: { tokenNumber: 'desc' }, select: { tokenNumber: true },
        });
        const occupied = await tx.appointment.findFirst({
          where: { doctorId: scope.doctorId, appointmentDate, appointmentTime: fixture.time, status: { not: 'CANCELLED' } },
          select: { id: true },
        });
        if (occupied) continue;
        const appointment = await tx.appointment.create({ data: {
          ...slot, sourceConsultationId: fixture.future && consultation?.status === 'COMPLETED' ? consultation.id : null,
          appointmentNumber, tokenNumber: (last?.tokenNumber ?? 0) + 1,
          appointmentTime: fixture.time, status: fixture.status, type: fixture.future ? 'FOLLOW_UP' : 'OPD',
          checkInAt: ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(fixture.status) ? new Date() : null,
          completedAt: fixture.status === 'COMPLETED' ? new Date() : null, reasonForVisit: 'Synthetic training case',
        } });
        if (fixture.key === 'DRAFT' || fixture.key === 'FINALIZED') {
          const finalized = fixture.key === 'FINALIZED';
          const consultation = await tx.consultation.create({ data: {
            appointmentId: appointment.id, hospitalId: scope.hospitalId, branchId: scope.branchId,
            patientId: scope.patientId, doctorId: scope.doctorId,
            status: finalized ? 'COMPLETED' : 'DRAFT', chiefComplaint: 'Synthetic training note',
            diagnosisNotes: finalized ? 'Synthetic assessment' : '', treatmentPlan: finalized ? 'Synthetic plan' : '',
          } });
          if (finalized) await tx.consultationAmendment.create({ data: {
            consultationId: consultation.id, hospitalId: scope.hospitalId, branchId: scope.branchId,
            authorId: doctor.employee.userId, reason: 'Demo clarification', note: 'Example append-only amendment.',
          } });
        }
        createdForDoctor++;
      }
      const recipient = { hospitalId: scope.hospitalId, branchId: scope.branchId, userId: doctor.employee.userId };
      const demoAppointment = await tx.appointment.findUnique({
        where: { appointmentNumber: `DEMO-DR-${today}-${index}-CHECKED-IN` },
      });
      const demoLab = await tx.labOrder.findUnique({ where: { orderNumber: `DEMO-LAB-001${suffix}` } });
      const notices = [];
      if (demoAppointment) notices.push({
        type: 'APPOINTMENT', title: 'New demo patient appointment',
        message: `Training patient ${patient.uhid} checked in (${demoAppointment.appointmentNumber}).`,
        linkUrl: `/appointments/${demoAppointment.id}`,
      });
      if (demoLab?.doctorId === scope.doctorId && demoLab.patientId === scope.patientId && demoLab.status === 'COMPLETED') {
        if (!demoLab.reportReleasedAt) await tx.labOrder.update({
          where: { id: demoLab.id }, data: { reportReleasedAt: new Date() },
        });
        notices.push({
          type: 'LAB_RESULT', title: 'Demo lab report available',
          message: `Lab order ${demoLab.orderNumber} has a released training report.`,
          linkUrl: `/laboratory/orders/${demoLab.id}`,
        });
      }
      for (const notice of notices) {
        if (!await tx.notification.findFirst({ where: { ...recipient, type: notice.type, linkUrl: notice.linkUrl }, select: { id: true } })) {
          await tx.notification.create({ data: { ...recipient, ...notice } });
        }
      }
      inserted += createdForDoctor;
    }
    return inserted;
  }, { timeout: 30_000, isolationLevel: 'Serializable' });
}

try {
  console.log(`Added ${await seed()} doctor appointments. Existing appointments were preserved.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
