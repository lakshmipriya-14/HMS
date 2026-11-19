import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  AuthUserDto,
  LoginResponseDto,
  ROLE_PERMISSIONS_MATRIX,
  Role,
} from '@multispeciality-hms/contracts';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
      include: {
        userRoles: { include: { role: true } },
        employee: {
          include: {
            doctor: true,
            nursingProfile: true,
          },
        },
        patient: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid hospital credentials');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account has been deactivated. Please contact administration.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid hospital credentials');
    }

    const primaryRole = (user.userRoles[0]?.role.name as Role) || Role.PATIENT;
    const permissions = ROLE_PERMISSIONS_MATRIX[primaryRole] || [];

    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: primaryRole,
      permissions,
      hospitalId: user.hospitalId || undefined,
      branchId: user.branchId || undefined,
      departmentId: user.employee?.departmentId || undefined,
      doctorProfileId: user.employee?.doctor?.id || undefined,
      patientProfileId: user.patient?.id || undefined,
      nurseProfileId: user.employee?.nursingProfile?.id || undefined,
      employeeId: user.employee?.id || undefined,
    };

    const payload = {
      sub: user.id,
      email: user.email,
      role: primaryRole,
      hospitalId: user.hospitalId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshTokenString = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'aalayam-enterprise-hms-jwt-refresh-secret-key-2026-very-secure',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }
    );

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenString,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        hospitalId: user.hospitalId,
        userId: user.id,
        userEmail: user.email,
        userRole: primaryRole,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress: ipAddress || '127.0.0.1',
        details: { loginTimestamp: new Date().toISOString() },
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 900, // 15 mins in seconds
      user: authUser,
    };
  }

  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'aalayam-enterprise-hms-jwt-refresh-secret-key-2026-very-secure',
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            include: {
              userRoles: { include: { role: true } },
              employee: {
                include: {
                  doctor: true,
                  nursingProfile: true,
                },
              },
              patient: true,
            },
          },
        },
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token is expired or revoked');
      }

      const user = tokenRecord.user;
      if (!user.isActive || user.deletedAt) {
        throw new UnauthorizedException('User account inactive');
      }

      // Revoke used token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      const primaryRole = (user.userRoles[0]?.role.name as Role) || Role.PATIENT;
      const permissions = ROLE_PERMISSIONS_MATRIX[primaryRole] || [];

      const authUser: AuthUserDto = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: primaryRole,
        permissions,
        hospitalId: user.hospitalId || undefined,
        branchId: user.branchId || undefined,
        departmentId: user.employee?.departmentId || undefined,
        doctorProfileId: user.employee?.doctor?.id || undefined,
        patientProfileId: user.patient?.id || undefined,
        nurseProfileId: user.employee?.nursingProfile?.id || undefined,
        employeeId: user.employee?.id || undefined,
      };

      const payload = {
        sub: user.id,
        email: user.email,
        role: primaryRole,
        hospitalId: user.hospitalId,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRATION || '15m',
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, tokenType: 'refresh' },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'aalayam-enterprise-hms-jwt-refresh-secret-key-2026-very-secure',
          expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
        }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt,
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
        user: authUser,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens on password change
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
