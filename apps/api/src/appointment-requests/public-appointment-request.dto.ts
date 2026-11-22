import { PUBLIC_APPOINTMENT_SPECIALTIES, PublicAppointmentRequestInput } from '@multispeciality-hms/contracts';
import { IsIn, IsString, Length, Matches } from 'class-validator';

export class PublicAppointmentRequestDto implements PublicAppointmentRequestInput {
  @IsString()
  @Length(1, 120)
  patientName: string;

  @IsString()
  @Length(1, 40)
  phone: string;

  @IsIn(PUBLIC_APPOINTMENT_SPECIALTIES)
  specialty: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Preferred date must use YYYY-MM-DD.' })
  preferredDate: string;
}
