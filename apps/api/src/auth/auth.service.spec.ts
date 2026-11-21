import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@multispeciality-hms/contracts';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('AuthService - Complete KIZUNA Authentication Suite', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: JwtService;

  const mockPassword = 'Password@123';
  let hashedPassword: string;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'doctor@kizunahospital.com',
    passwordHash: '',
    firstName: 'Dr. Senthil',
    lastName: 'Nathan',
    isActive: true,
    deletedAt: null,
    hospitalId: 'hospital-uuid-001',
    userRoles: [
      { role: { name: Role.DOCTOR } },
      { role: { name: Role.DEPARTMENT_ADMIN } },
    ],
    employee: {
      departmentId: 'dept-cardio',
      doctor: { id: 'doc-profile-001' },
    },
    patient: null,
  };

  const mockInactiveUser = {
    ...mockUser,
    id: 'user-inactive-456',
    email: 'inactive@kizunahospital.com',
    isActive: false,
  };

  const mockDeletedUser = {
    ...mockUser,
    id: 'user-deleted-789',
    email: 'deleted@kizunahospital.com',
    deletedAt: new Date(),
  };

  const refreshTokensDb = new Map<string, any>();

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(mockPassword, 10);
    mockUser.passwordHash = hashedPassword;
    mockInactiveUser.passwordHash = hashedPassword;
    mockDeletedUser.passwordHash = hashedPassword;
  });

  beforeEach(async () => {
    refreshTokensDb.clear();

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.email === 'doctor@kizunahospital.com') return Promise.resolve(mockUser);
          if (where.email === 'inactive@kizunahospital.com') return Promise.resolve(mockInactiveUser);
          if (where.email === 'deleted@kizunahospital.com') return Promise.resolve(mockDeletedUser);
          if (where.id === mockUser.id) return Promise.resolve(mockUser);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      refreshToken: {
        create: jest.fn().mockImplementation(({ data }) => {
          const rec = {
            id: 'rt-id-' + Math.random(),
            userId: data.userId,
            token: data.token,
            expiresAt: data.expiresAt,
            isRevoked: false,
            user: mockUser,
          };
          refreshTokensDb.set(data.token, rec);
          return Promise.resolve(rec);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.token) return Promise.resolve(refreshTokensDb.get(where.token) || null);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const rec = Array.from(refreshTokensDb.values()).find((r) => r.id === where.id || r.token === where.token);
          if (rec) {
            rec.isRevoked = data.isRevoked;
          }
          return Promise.resolve(rec);
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          for (const rec of refreshTokensDb.values()) {
            if (rec.userId === where.userId) {
              rec.isRevoked = data.isRevoked;
            }
          }
          return Promise.resolve({ count: refreshTokensDb.size });
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-id-123' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => {
              return 'mock.jwt.token.' + Math.random();
            }),
            verify: jest.fn().mockImplementation((token) => {
              if (token === 'expired.refresh.token') throw new Error('jwt expired');
              if (token === 'invalid.refresh.token') throw new Error('invalid token');
              return { sub: mockUser.id, tokenType: 'refresh' };
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('1. Valid login: Returns access and refresh tokens and user profile with roles', async () => {
    const res = await authService.login({
      email: 'doctor@kizunahospital.com',
      password: mockPassword,
    });

    expect(res).toBeDefined();
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user.email).toBe('doctor@kizunahospital.com');
    expect(res.user.role).toBe(Role.DOCTOR);
    expect(res.user.roles).toContain(Role.DOCTOR);
    expect(res.user.roles).toContain(Role.DEPARTMENT_ADMIN);
  });

  it('2. Invalid email: Throws UnauthorizedException', async () => {
    await expect(
      authService.login({
        email: 'invalid@kizunahospital.com',
        password: mockPassword,
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('3. Incorrect password: Throws UnauthorizedException', async () => {
    await expect(
      authService.login({
        email: 'doctor@kizunahospital.com',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('4. Inactive account: Throws UnauthorizedException', async () => {
    await expect(
      authService.login({
        email: 'inactive@kizunahospital.com',
        password: mockPassword,
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('5. Deleted account: Throws UnauthorizedException', async () => {
    await expect(
      authService.login({
        email: 'deleted@kizunahospital.com',
        password: mockPassword,
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('6 & 7. Valid refresh token: Issues new token pair', async () => {
    const loginRes = await authService.login({
      email: 'doctor@kizunahospital.com',
      password: mockPassword,
    });

    const refreshRes = await authService.refreshToken(loginRes.refreshToken);
    expect(refreshRes).toBeDefined();
    expect(refreshRes.accessToken).toBeDefined();
    expect(refreshRes.refreshToken).toBeDefined();
  });

  it('8 & 11. Invalid or expired refresh token: Throws UnauthorizedException', async () => {
    await expect(authService.refreshToken('invalid.refresh.token')).rejects.toThrow(
      UnauthorizedException
    );
    await expect(authService.refreshToken('expired.refresh.token')).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('9 & 10. Reuse old refresh token: Throws UnauthorizedException and revokes token family', async () => {
    const loginRes = await authService.login({
      email: 'doctor@kizunahospital.com',
      password: mockPassword,
    });

    const firstRefresh = loginRes.refreshToken;
    await authService.refreshToken(firstRefresh);

    // Reuse the already revoked token
    await expect(authService.refreshToken(firstRefresh)).rejects.toThrow(UnauthorizedException);
  });

  it('12. Change password with wrong current password: Throws BadRequestException', async () => {
    await expect(
      authService.changePassword(mockUser.id, {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('13. Change password with correct password: Updates password and revokes tokens', async () => {
    await expect(
      authService.changePassword(mockUser.id, {
        currentPassword: mockPassword,
        newPassword: 'NewPassword123',
      })
    ).resolves.not.toThrow();

    expect(prismaService.user.update).toHaveBeenCalled();
    expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      data: { isRevoked: true },
    });
  });

  it('14 & 15. Logout & Refresh after logout: Revokes session and prevents refresh', async () => {
    const loginRes = await authService.login({
      email: 'doctor@kizunahospital.com',
      password: mockPassword,
    });

    await authService.logout(mockUser.id);

    await expect(authService.refreshToken(loginRes.refreshToken)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('16. User selects unassigned role: Throws ForbiddenException', async () => {
    await expect(
      authService.login({
        email: 'doctor@kizunahospital.com',
        password: mockPassword,
        selectedRole: Role.SUPER_ADMIN,
      })
    ).rejects.toThrow(ForbiddenException);

    await expect(authService.switchRole(mockUser.id, Role.SUPER_ADMIN)).rejects.toThrow(
      ForbiddenException
    );
  });
});
