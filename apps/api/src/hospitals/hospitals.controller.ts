import { Controller, Get, Param } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { HospitalsService } from './hospitals.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Hospitals & Organization')
@Controller('hospitals')
@Scoped()
@RequirePermissions('HOSPITALS:VIEW')
export class HospitalsController {
  constructor(private service: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all hospitals and branches' })
  async findAll(@CurrentUser() user: AuthUserDto) {
    const hospitals = await this.service.findAll(user);
    return {
      message: 'Hospitals retrieved successfully',
      data: hospitals,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details' })
  async findOne(@CurrentUser() user: AuthUserDto, @Param('id') id: string) {
    const hospital = await this.service.findOne(user, id);
    return {
      message: 'Hospital details retrieved',
      data: hospital,
    };
  }
}
