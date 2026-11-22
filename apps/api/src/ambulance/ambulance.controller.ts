import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AmbulanceService } from './ambulance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAmbulanceRequestDto, UpdateTripStatusDto, AuthUserDto } from '@multispeciality-hms/contracts';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Ambulance & Emergency Dispatch')
@Controller('ambulance')
export class AmbulanceController {
  constructor(private service: AmbulanceService) {}

  @Get('vehicles')
  @ApiOperation({ summary: 'List ambulance fleet and real-time availability' })
  async getVehicles(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getVehicles(actor, branchId);
    return {
      message: 'Ambulance vehicles retrieved',
      data,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active emergency dispatches and trips' })
  async getActiveTrips(
    @CurrentUser() actor?: AuthUserDto,
    @Query('branchId') branchId?: string
  ) {
    const data = await this.service.getActiveTrips(actor, branchId);
    return {
      message: 'Active emergency trips retrieved',
      data,
    };
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create emergency dispatch request and assign vehicle' })
  async createRequest(
    @Body() dto: CreateAmbulanceRequestDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.createEmergencyRequest(dto, actor);
    return {
      message: 'Emergency ambulance dispatched immediately',
      data,
    };
  }

  @Patch('trips/:id/status')
  @ApiOperation({ summary: 'Update trip status from mobile driver terminal' })
  async updateTripStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto,
    @CurrentUser() actor?: AuthUserDto
  ) {
    const data = await this.service.updateTripStatus(id, dto, actor);
    return {
      message: 'Ambulance trip status updated',
      data,
    };
  }
}
