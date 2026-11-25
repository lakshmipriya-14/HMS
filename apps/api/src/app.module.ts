import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppointmentRequestsModule } from './appointment-requests/appointment-requests.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { NursingModule } from './nursing/nursing.module';
import { LaboratoryModule } from './laboratory/laboratory.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { RadiologyModule } from './radiology/radiology.module';
import { WardsModule } from './wards/wards.module';
import { BillingModule } from './billing/billing.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { DepartmentAdminModule } from './department-admin/department-admin.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve('.env'), resolve(__dirname, '../../../.env')],
    }),
    PrismaModule,
    AuthModule,
    HospitalsModule,
    DepartmentsModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    AppointmentRequestsModule,
    ConsultationsModule,
    PrescriptionsModule,
    NursingModule,
    LaboratoryModule,
    PharmacyModule,
    RadiologyModule,
    WardsModule,
    BillingModule,
    AmbulanceModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
    SuperAdminModule,
    ApprovalsModule,
    DepartmentAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
