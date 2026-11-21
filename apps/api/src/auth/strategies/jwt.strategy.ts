import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUserDto, ROLE_PERMISSIONS_MATRIX, Role } from '@multispeciality-hms/contracts';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'kizuna-enterprise-hms-jwt-access-secret-key-2026-very-secure',
    });
  }

  async validate(payload: { sub: string; email: string; role: Role }): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    const primaryRole = (user.userRoles[0]?.role.name as Role) || Role.PATIENT;
    const permissions = ROLE_PERMISSIONS_MATRIX[primaryRole] || [];

    return {
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
  }
}
