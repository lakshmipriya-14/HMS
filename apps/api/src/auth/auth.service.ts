import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  AuthUserDto,
  LoginResponseDto,
  ROLE_PERMISSIONS_MATRIX,
  Role,
} from '@multispeciality-hms/contracts';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private async generateUserDto(
    user: any,
    activeRole: Role,
    assignedRoles: Role[]
  ): Promise<AuthUserDto> {
    const permissions = ROLE_PERMISSIONS_MATRIX[activeRole] || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: activeRole,
      roles: assignedRoles,
      permissions,
      hospitalId: user.hospitalId || undefined,
      branchId: user.branchId || undefined,
      departmentId: user.employee?.departmentId || undefined,
      doctorProfileId: user.employee?.doctor?.id || undefined,
      patientProfileId: user.patient?.id || undefined,
      nurseProfileId: user.employee?.nursingProfile?.id || undefined,
      employeeId: user.employee?.id || undefined,
    };
  }

  private async issueTokenPair(
    user: any,
    activeRole: Role,
    assignedRoles: Role[]
  ): Promise<LoginResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: activeRole,
      roles: assignedRoles,
      hospitalId: user.hospitalId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshTokenString = this.jwtService.sign(
      { sub: user.id, tokenType: 'refresh', jti: crypto.randomUUID() },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'kizuna-enterprise-hms-jwt-refresh-secret-key-2026-very-secure',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }
    );

    const tokenHash = hashToken(refreshTokenString);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const authUser = await this.generateUserDto(user, activeRole, assignedRoles);

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 900, // 15 mins in seconds
      user: authUser,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const normalizedEmail = loginDto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
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
      throw new UnauthorizedException('Invalid hospital credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid hospital credentials');
    }

    const assignedRoles = user.userRoles.map((ur) => ur.role.name as Role);
    const availableRoles = assignedRoles.length > 0 ? assignedRoles : [Role.PATIENT];

    let activeRole = availableRoles[0];
    if (loginDto.selectedRole) {
      if (!availableRoles.includes(loginDto.selectedRole)) {
        throw new ForbiddenException('Selected role is not assigned to this user');
      }
      activeRole = loginDto.selectedRole;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        hospitalId: user.hospitalId || undefined,
        userId: user.id,
        userEmail: user.email,
        userRole: activeRole,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress: ipAddress || '127.0.0.1',
        details: { loginTimestamp: new Date().toISOString(), selectedRole: activeRole },
      },
    });

    return this.issueTokenPair(user, activeRole, availableRoles);
  }

  async switchRole(userId: string, targetRole: Role, ipAddress?: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is invalid, deactivated, or deleted');
    }

    const assignedRoles = user.userRoles.map((ur) => ur.role.name as Role);
    const availableRoles = assignedRoles.length > 0 ? assignedRoles : [Role.PATIENT];

    if (!availableRoles.includes(targetRole)) {
      throw new ForbiddenException('Selected role is not assigned to this user');
    }

    await this.prisma.auditLog.create({
      data: {
        hospitalId: user.hospitalId || undefined,
        userId: user.id,
        userEmail: user.email,
        userRole: targetRole,
        action: 'SWITCH_ROLE',
        resource: 'AUTH',
        ipAddress: ipAddress || '127.0.0.1',
        details: { switchedToRole: targetRole },
      },
    });

    return this.issueTokenPair(user, targetRole, availableRoles);
  }

  async refreshToken(refreshTokenString: string): Promise<LoginResponseDto> {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshTokenString, {
        secret: process.env.JWT_REFRESH_SECRET || 'kizuna-enterprise-hms-jwt-refresh-secret-key-2026-very-secure',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshTokenString);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
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

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Token Reuse Detection
    if (tokenRecord.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token has been revoked due to reuse detection');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is expired');
    }

    const user = tokenRecord.user;
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is invalid or deactivated');
    }

    // Revoke current refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const assignedRoles = user.userRoles.map((ur) => ur.role.name as Role);
    const availableRoles = assignedRoles.length > 0 ? assignedRoles : [Role.PATIENT];
    const activeRole = availableRoles[0];

    return this.issueTokenPair(user, activeRole, availableRoles);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is invalid or deactivated');
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

    await this.prisma.auditLog.create({
      data: {
        hospitalId: user.hospitalId || undefined,
        userId: user.id,
        userEmail: user.email,
        userRole: 'USER',
        action: 'CHANGE_PASSWORD',
        resource: 'AUTH',
        ipAddress: '127.0.0.1',
        details: { timestamp: new Date().toISOString() },
      },
    });
  }

  async logout(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hospitalId: true, email: true },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        hospitalId: user?.hospitalId || undefined,
        userId,
        userEmail: user?.email || 'unknown@kizunahospital.com',
        userRole: 'LOGOUT',
        action: 'LOGOUT',
        resource: 'AUTH',
        ipAddress: '127.0.0.1',
        details: { timestamp: new Date().toISOString() },
      },
    });
  }
}
