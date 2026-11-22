
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { Role } from '@multispeciality-hms/contracts';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, ROLES_KEY, SCOPED_KEY } from '../common/decorators/roles.decorator';
import { AuthService, tokenDigest } from './auth.service';
import { ConfiguredOtpDelivery, jwtSecret } from './auth-config';
import { resolveAccess } from './access-context';
import { PasswordRecoveryService } from './password-recovery.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';

const secret = randomBytes(40).toString('hex');
const password = 'Mock-only password for tests';
const updatedPassword = 'Another mock-only test password';

function mocks(role: Role = Role.HOSPITAL_ADMIN) {
  const isHospitalScope = role === Role.SUPER_ADMIN || role === Role.PATIENT;
  const assignment = {
    roleId: 'role', hospitalId: 'hospital',
    branchId: isHospitalScope ? null : 'north',
    departmentId: null as string | null,
    branch: isHospitalScope ? undefined : ({ isActive: true, deletedAt: null } as { isActive: boolean; deletedAt: Date | null }),
    department: undefined as { branchId: string | null; isActive: boolean; deletedAt: Date | null } | undefined,
    role: { name: role, rolePermissions: [{ permission: { resource: 'USERS', action: 'VIEW' } }] },
  };
  const user = {
    id: 'user', hospitalId: 'hospital', email: 'staff@example.test', firstName: 'Test', lastName: 'Staff',
    passwordHash: bcrypt.hashSync(password, 4), userRoles: [assignment], patient: null,
    employee: { id: 'employee', doctor: { id: 'doctor', branchId: 'north', departmentId: 'cardiology' }, nursingProfile: null },
  };
  const sessions: any[] = [];
  let challenge: any;
  const db = {
    $queryRaw: jest.fn(),
    user: {
      findFirst: jest.fn(async () => user),
      findUnique: jest.fn(async () => user),
      update: jest.fn(async ({ data }) => Object.assign(user, data)),
      updateMany: jest.fn(async ({ data }) => { Object.assign(user, data); return { count: 1 }; }),
      findMany: jest.fn(async () => []),
    },
    hospitalRolePolicy: { findUnique: jest.fn<Promise<{ grants: string[] } | null>, any[]>().mockResolvedValue(null) },
    auditLog: { create: jest.fn() },
    refreshToken: {
      create: jest.fn(async ({ data }) => {
        const session = { id: String(sessions.length + 1), revokedAt: null, replacedById: null, ...data };
        sessions.push(session); return session;
      }),
      findUnique: jest.fn(async ({ where }) => sessions.find(s => s.tokenHash === where.tokenHash)),
      findFirst: jest.fn(async ({ where }) => sessions.find(s => s.userId === where.userId && s.familyId === where.familyId
        && s.revokedAt === null && s.expiresAt > where.expiresAt.gt)),
      update: jest.fn(async ({ where, data }) => Object.assign(sessions.find(s => s.id === where.id), data)),
      updateMany: jest.fn(async ({ where, data }) => {
        const rows = sessions.filter(s => s.userId === where.userId && !s.revokedAt && (!where.familyId || where.familyId === s.familyId));
        rows.forEach(s => Object.assign(s, data)); return { count: rows.length };
      }),
    },
    passwordResetChallenge: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(async ({ where }) => where.destinationHash ? challenge : null),
      findUnique: jest.fn(async () => challenge),
      create: jest.fn(async ({ data }) => challenge = { id: 'challenge', attemptCount: 0, verifiedAt: null, consumedAt: null, revokedAt: null, ...data }),
      update: jest.fn(async ({ data }) => {
        if (data.attemptCount) challenge.attemptCount += data.attemptCount.increment;
        if (data.otpHash) challenge.otpHash = data.otpHash;
        if (data.verifiedAt) challenge.verifiedAt = data.verifiedAt;
        if (data.revokedAt) challenge.revokedAt = data.revokedAt;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        if (!challenge || challenge.revokedAt || challenge.consumedAt
          || (where.otpHash && challenge.otpHash !== where.otpHash)) return { count: 0 };
        Object.assign(challenge, data); return { count: 1 };
      }),
    },
    accountAccessToken: { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(callback => callback(db));
  const prisma = db as unknown as PrismaService;
  const jwt = new JwtService({ secret, signOptions: { issuer: 'uyirinai-hms', audience: 'uyirinai-staff', expiresIn: 900 } });
  const auth = new AuthService(prisma, jwt);
  return { db, user, assignment, sessions, auth, prisma, jwt, challenge: () => challenge };
}

function context(user?: unknown): ExecutionContext {
  return { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => ({ user }) }) } as unknown as ExecutionContext;
}

describe('Phase 2 auth with an in-memory Prisma mock', () => {
  const before = { ...process.env };
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.AUTH_DEV_OTP_ENABLED = 'true';
    process.env.AUTH_DEV_OTP = '123456';
    process.env.NODE_ENV = 'test';
    process.env.API_HOST = '127.0.0.1';
  });
  afterEach(() => { process.env = { ...before }; });

  it('validates login and keeps only a digest of the refresh token', async () => {
    const { auth, user, sessions, jwt, prisma } = mocks();
    await expect(auth.login({ email: user.email, password: 'wrong' })).rejects.toHaveProperty('status', 401);
    const session = await auth.login({ email: user.email, password });
    expect(session.user).not.toHaveProperty('passwordHash');
    expect(sessions[0].tokenHash).toBe(tokenDigest(session.refreshToken));
    expect(sessions[0].tokenHash).not.toBe(session.refreshToken);
    const claims = jwt.verify(session.accessToken);
    await expect(new JwtStrategy(prisma).validate(claims)).resolves.toMatchObject({ id: user.id });
    const expired = jwt.sign({ sub: user.id, sid: claims.sid, kind: 'access' }, { expiresIn: -1 });
    expect(() => jwt.verify(expired)).toThrow('jwt expired');
    expect(() => jwt.verify('bad-token')).toThrow();
    await auth.logout(session.refreshToken);
    await expect(new JwtStrategy(prisma).validate(claims)).rejects.toHaveProperty('status', 401);
  });

  it('restores by rotating a session and revokes the family when a replaced token is replayed', async () => {
    const { auth, user, sessions } = mocks();
    const first = await auth.login({ email: user.email, password });
    const next = await auth.refreshToken(first.refreshToken);
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect(sessions[0].replacedById).toBe(sessions[1].id);
    expect(sessions[1].expiresAt).toEqual(sessions[0].expiresAt);
    await expect(auth.refreshToken(first.refreshToken)).rejects.toHaveProperty('status', 401);
    await expect(auth.refreshToken(next.refreshToken)).rejects.toHaveProperty('status', 401);
  });

  it('sets an HttpOnly refresh cookie on a trusted browser origin and withholds the token from JSON', async () => {
    process.env.CORS_ORIGINS = 'http://localhost:8081';
    const { auth, user, prisma } = mocks();
    const controller = new AuthController(auth, new PasswordRecoveryService(prisma, new ConfiguredOtpDelivery()));
    const req = (origin: string) => ({ get: (name: string) => name === 'origin' ? origin : 'cookie' }) as unknown as Request;
    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;
    await expect(controller.login({ email: user.email, password }, req('https://other.example'), res))
      .rejects.toHaveProperty('status', 403);
    expect(cookie).not.toHaveBeenCalled();
    const result = await controller.login({ email: user.email, password }, req('http://localhost:8081'), res);
    expect(cookie).toHaveBeenCalledWith('uyirinai_refresh', expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/api/v1/auth' }));
    expect(result.data.refreshToken).toBe('');
  });

  it('rejects expired refresh sessions', async () => {
    const { auth, user, sessions } = mocks();
    const first = await auth.login({ email: user.email, password });
    sessions[0].expiresAt = new Date(0);
    await expect(auth.refreshToken(first.refreshToken)).rejects.toHaveProperty('status', 401);
  });

  it('changes a password only with the current password and invalidates sessions', async () => {
    const { auth, user } = mocks();
    const first = await auth.login({ email: user.email, password });
    await expect(auth.changePassword(user.id, { currentPassword: 'wrong', newPassword: updatedPassword }))
      .rejects.toHaveProperty('status', 400);
    await auth.changePassword(user.id, { currentPassword: password, newPassword: updatedPassword });
    await expect(auth.refreshToken(first.refreshToken)).rejects.toHaveProperty('status', 401);
    await expect(auth.login({ email: user.email, password: updatedPassword })).resolves.toHaveProperty('accessToken');
  });

  it('redeems an eligible one-time account access code once', async () => {
    const { auth, db, prisma, user } = mocks();
    const code = randomBytes(32).toString('base64url');
    const record = { userId: user.id, hospitalId: user.hospitalId, revokedAt: null, redeemedAt: null,
      expiresAt: new Date(Date.now() + 60_000) };
    db.accountAccessToken.findUnique.mockResolvedValue(record);
    db.accountAccessToken.updateMany.mockImplementation(async ({ where, data }) => {
      if (where.digest !== tokenDigest(code) || record.redeemedAt) return { count: 0 };
      Object.assign(record, data); return { count: 1 };
    });
    const recovery = new PasswordRecoveryService(prisma, new ConfiguredOtpDelivery());
    await recovery.redeem(code, updatedPassword);
    await expect(recovery.redeem(code, updatedPassword)).rejects.toHaveProperty('status', 400);
    await expect(auth.login({ email: user.email, password: updatedPassword })).resolves.toHaveProperty('accessToken');
  });

  it('verifies development OTP once, resets the password and revokes the prior session', async () => {
    const { auth, prisma, user, challenge } = mocks();
    const first = await auth.login({ email: user.email, password });
    const recovery = new PasswordRecoveryService(prisma, new ConfiguredOtpDelivery());
    await expect(recovery.request(user.email)).resolves.toEqual({ mode: 'development' });
    expect(challenge().otpHash).not.toBe('123456');
    await expect(recovery.verify(user.email, '999999')).rejects.toHaveProperty('status', 400);
    const proof = await recovery.verify(user.email, '123456');
    await expect(recovery.verify(user.email, '123456')).rejects.toHaveProperty('status', 400);
    await recovery.reset(proof.challengeId, proof.resetToken, updatedPassword);
    await expect(recovery.reset(proof.challengeId, proof.resetToken, updatedPassword)).rejects.toHaveProperty('status', 400);
    await expect(auth.refreshToken(first.refreshToken)).rejects.toHaveProperty('status', 401);
    await expect(auth.login({ email: user.email, password })).rejects.toHaveProperty('status', 401);
    await expect(auth.login({ email: user.email, password: updatedPassword })).resolves.toHaveProperty('accessToken');
  });

  it('rejects expired and attempt-limited challenges', async () => {
    const { prisma, user, challenge } = mocks();
    const recovery = new PasswordRecoveryService(prisma, new ConfiguredOtpDelivery());
    await recovery.request(user.email);
    challenge().expiresAt = new Date(0);
    await expect(recovery.verify(user.email, '123456')).rejects.toHaveProperty('status', 400);
    challenge().expiresAt = new Date(Date.now() + 60_000);
    for (let i = 0; i < 5; i++) await expect(recovery.verify(user.email, '999999')).rejects.toHaveProperty('status', 400);
    expect(challenge().attemptCount).toBe(5);
    await expect(recovery.verify(user.email, '123456')).rejects.toHaveProperty('status', 400);
  });

  it('rejects development OTP configuration in production and refuses fake delivery', async () => {
    process.env.NODE_ENV = 'production';
    expect(() => new ConfiguredOtpDelivery()).toThrow('Development OTP requires');
    delete process.env.AUTH_DEV_OTP_ENABLED;
    const provider = new ConfiguredOtpDelivery();
    expect(() => provider.generate()).toThrow('delivery is unavailable');
    const { prisma } = mocks();
    await expect(new PasswordRecoveryService(prisma, provider).request('staff@example.test')).rejects.toHaveProperty('status', 503);
    delete process.env.JWT_SECRET;
    expect(() => jwtSecret()).toThrow('JWT_SECRET');
  });

  it('rejects a delivery adapter that tries to use the reserved development OTP', async () => {
    const { prisma, db } = mocks();
    const delivery = { mode: 'delivery' as const, generate: () => '123456', deliver: jest.fn() };
    await expect(new PasswordRecoveryService(prisma, delivery).request('staff@example.test')).rejects.toHaveProperty('status', 503);
    expect(db.user.findFirst).not.toHaveBeenCalled();
    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it('checks database grants, hospital overrides and ambiguous assignments', async () => {
    const { prisma, db, user, assignment } = mocks(Role.SUPER_ADMIN);
    const allowed = await resolveAccess(prisma, user.id);
    expect(allowed.permissions).toEqual(['USERS:VIEW']);
    db.hospitalRolePolicy.findUnique.mockResolvedValue({ grants: [] });
    await expect(resolveAccess(prisma, user.id)).resolves.toMatchObject({ permissions: [] });
    db.hospitalRolePolicy.findUnique.mockResolvedValue({ grants: ['USERS:VIEW'] });
    assignment.role.rolePermissions = [];
    await expect(resolveAccess(prisma, user.id)).resolves.toMatchObject({ permissions: [] });
    user.userRoles.push(assignment);
    await expect(resolveAccess(prisma, user.id)).rejects.toHaveProperty('status', 401);
  });

  it('enforces Department Admin branch and department and the doctor operating branch', async () => {
    const { prisma, db, user, assignment } = mocks(Role.DEPARTMENT_ADMIN);
    assignment.branchId = 'north';
    assignment.departmentId = 'cardiology';
    assignment.branch = { isActive: true, deletedAt: null };
    assignment.department = { isActive: true, deletedAt: null, branchId: 'north' };
    const actor = await resolveAccess(prisma, user.id);
    await new UsersService(prisma).findAll(actor);
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { hospitalId: 'hospital', deletedAt: null, employee: { branchId: 'north', departmentId: 'cardiology' } },
    }));
    assignment.department.branchId = 'south';
    await expect(resolveAccess(prisma, user.id)).rejects.toHaveProperty('status', 401);
    assignment.role.name = Role.DOCTOR;
    assignment.department.branchId = 'north';
    await expect(resolveAccess(prisma, user.id)).resolves.toMatchObject({ branchId: 'north' });
    user.employee.doctor.branchId = 'south';
    await expect(resolveAccess(prisma, user.id)).rejects.toHaveProperty('status', 401);
  });

  it('separates Hospital Admin and Super Admin and keeps public intake available', () => {
    const values: Record<string, unknown> = { [SCOPED_KEY]: true, [PERMISSIONS_KEY]: ['REPORTS:VIEW'], [ROLES_KEY]: [Role.SUPER_ADMIN] };
    const reflector = { getAllAndOverride: (key: string) => values[key] } as unknown as Reflector;
    const roles = new RolesGuard(reflector), permissions = new PermissionsGuard(reflector);
    expect(() => roles.canActivate(context({ role: Role.HOSPITAL_ADMIN }))).toThrow('Requires role');
    expect(roles.canActivate(context({ role: Role.SUPER_ADMIN }))).toBe(true);
    expect(() => permissions.canActivate(context())).toThrow('hospital scope');
    expect(() => permissions.canActivate(context({ hospitalId: 'hospital', role: Role.SUPER_ADMIN, permissions: [] }))).toThrow('Missing required permission');
    values[SCOPED_KEY] = false;
    expect(() => permissions.canActivate(context({ hospitalId: 'hospital' }))).toThrow('not enabled');
    values[IS_PUBLIC_KEY] = true;
    expect(permissions.canActivate(context())).toBe(true);
  });
});
