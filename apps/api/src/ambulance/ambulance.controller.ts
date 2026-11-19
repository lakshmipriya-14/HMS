import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { AmbulanceService } from './ambulance.service';
import { CreateAmbulanceRequestDto, UpdateTripStatusDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Ambulance & Emergency Dispatch')
@Controller('ambulance')
export class AmbulanceController {
  constructor(private service: AmbulanceService) {}

  @Get('vehicles')
  @ApiOperation({ summary: 'List ambulance fleet and real-time availability' })
  async getVehicles() {
    const data = await this.service.getVehicles();
    return {
      message: 'Ambulance vehicles retrieved',
      data,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active emergency dispatches and trips' })
  async getActiveTrips() {
    const data = await this.service.getActiveTrips();
    return {
      message: 'Active emergency trips retrieved',
      data,
    };
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create emergency dispatch request and assign vehicle' })
  async createRequest(@Body() dto: CreateAmbulanceRequestDto) {
    const data = await this.service.createEmergencyRequest(dto);
    return {
      message: 'Emergency ambulance dispatched immediately',
      data,
    };
  }

  @Patch('trips/:id/status')
  @ApiOperation({ summary: 'Update trip status from mobile driver terminal' })
  async updateTripStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto
  ) {
    const data = await this.service.updateTripStatus(id, dto);
    return {
      message: 'Ambulance trip status updated',
      data,
    };
  }
}
