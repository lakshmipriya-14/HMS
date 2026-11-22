import { Module } from '@nestjs/common';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { AppointmentRequestsService } from './appointment-requests.service';
import { PublicRequestRateGuard } from './public-request-rate.guard';

@Module({
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService, PublicRequestRateGuard],
})
export class AppointmentRequestsModule {}
