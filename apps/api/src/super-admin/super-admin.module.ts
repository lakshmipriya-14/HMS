import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminReadService } from './super-admin-read.service';

@Module({
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminReadService],
})
export class SuperAdminModule {}
