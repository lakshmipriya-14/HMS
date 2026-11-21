import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@multispeciality-hms/contracts';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid hospital email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role selected' })
  selectedRole?: Role;
}

export class SwitchRoleDto {
  @IsEnum(Role, { message: 'Invalid role selected' })
  @IsNotEmpty()
  role: Role;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @IsNotEmpty()
  newPassword: string;
}
