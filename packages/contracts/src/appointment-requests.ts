export const PUBLIC_APPOINTMENT_SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Pediatrics',
  'Gynecology', 'Dermatology', 'ENT Care', 'General Surgery', 'Urology',
] as const;

export type PublicAppointmentSpecialty = typeof PUBLIC_APPOINTMENT_SPECIALTIES[number];

export interface PublicAppointmentRequestInput {
  patientName: string;
  phone: string;
  specialty: string;
  preferredDate: string;
}

export interface PublicAppointmentRequestReceipt {
  reference: string;
}

const hospitalCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
});
const DAY_MS = 86_400_000;
export function normalizeAppointmentPhone(value: string): string {
  const compact = value.trim().replace(/[ ().-]/g, '');
  if (/^[6-9]\d{9}$/.test(compact)) return '+91' + compact;
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
    throw new Error('Enter a valid Indian mobile number or international number with a country code.');
  }
  if (compact.startsWith('+91') && !/^\+91[6-9]\d{9}$/.test(compact)) {
    throw new Error('Enter a valid Indian mobile number.');
  }
  return compact;
}

export function parseAppointmentPreferredDate(value: string, now = new Date()): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Preferred date must use YYYY-MM-DD.');
  }
  const date = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Enter a valid preferred date.');
  }
  const parts = Object.fromEntries(hospitalCalendar.formatToParts(now).map(part => [part.type, part.value]));
  const today = Date.parse(`${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`);
  if (date.getTime() < today || date.getTime() > today + 90 * DAY_MS) {
    throw new Error('Choose a preferred date from today through the next 90 days.');
  }
  return date;
}
