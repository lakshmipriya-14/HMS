import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions, Scoped } from '../common/decorators/roles.decorator';
import { HospitalsService } from './hospitals.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Hospitals & Organization')
@Controller('hospitals')
@Scoped()
export class HospitalsController {
  constructor(private service: HospitalsService) {}

  @Get()
  @RequirePermissions('HOSPITALS:VIEW')
  @ApiOperation({ summary: 'List all hospitals and branches' })
  async findAll(@CurrentUser() user: AuthUserDto) {
    const hospitals = await this.service.findAll(user);
    return {
      message: 'Hospitals retrieved successfully',
      data: hospitals,
    };
  }

  @Get(':id')
  @RequirePermissions('HOSPITALS:VIEW')
  @ApiOperation({ summary: 'Get hospital details' })
  async findOne(@CurrentUser() user: AuthUserDto, @Param('id') id: string) {
    const hospital = await this.service.findOne(user, id);
    return {
      message: 'Hospital details retrieved',
      data: hospital,
    };
  }

  @Patch(':id')
  @RequirePermissions('HOSPITALS:UPDATE')
  @ApiOperation({ summary: 'Update hospital information and profile' })
  async update(
    @CurrentUser() user: AuthUserDto,
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      tamilName?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      phone?: string;
      emergencyPhone?: string;
      email?: string;
    }
  ) {
    const hospital = await this.service.update(user, id, dto);
    return {
      message: 'Hospital settings updated successfully',
      data: hospital,
    };
  }
}
