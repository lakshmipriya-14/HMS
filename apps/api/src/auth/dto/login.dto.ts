import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecoveryEmailDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}
export class LoginDto extends RecoveryEmailDto {
  @IsString()
  @Length(1, 72)
  password: string;
}
export class RefreshTokenDto {
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  refreshToken?: string;
}
export class NewPasswordDto {
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  newPassword: string;
}
export class ChangePasswordDto extends NewPasswordDto {
  @IsString()
  @Length(1, 72)
  currentPassword: string;
}
export class VerifyOtpDto extends RecoveryEmailDto {
  @Matches(/^\d{6}$/)
  otp: string;
}
export class ResetPasswordDto extends NewPasswordDto {
  @IsString()
  @Length(1, 128)
  challengeId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  resetToken: string;
}
export class RedeemAccessDto extends NewPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  code: string;
}
