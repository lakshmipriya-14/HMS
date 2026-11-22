import { Body, Controller, Header, Post, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/roles.decorator';
import { AppointmentRequestsService } from './appointment-requests.service';
import { PublicAppointmentRequestDto } from './public-appointment-request.dto';
import { PublicRequestRateGuard } from './public-request-rate.guard';

@Controller('public/appointment-requests')
export class AppointmentRequestsController {
  constructor(private readonly service: AppointmentRequestsService) {}

  @Public()
  @Post()
  @Header('Cache-Control', 'no-store')
  @UseGuards(PublicRequestRateGuard)
  async submit(@Body() input: PublicAppointmentRequestDto) {
    return { message: 'Appointment request received.', data: await this.service.submit(input) };
  }
}
