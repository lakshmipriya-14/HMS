import { Module } from '@nestjs/common';
import { DepartmentAdminController } from './department-admin.controller';
import { DepartmentAdminService } from './department-admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DepartmentAdminController],
  providers: [DepartmentAdminService],
  exports: [DepartmentAdminService],
})
export class DepartmentAdminModule {}
