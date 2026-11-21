import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ACCESS_TOKEN_SECONDS, ConfiguredOtpDelivery, jwtSecret, OTP_DELIVERY } from './auth-config';
import { PasswordRecoveryService } from './password-recovery.service';
import { PublicRequestRateGuard } from '../appointment-requests/public-request-rate.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { algorithm: 'HS256', issuer: 'uyirinai-hms', audience: 'uyirinai-staff', expiresIn: ACCESS_TOKEN_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordRecoveryService, PublicRequestRateGuard, { provide: OTP_DELIVERY, useClass: ConfiguredOtpDelivery }],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
