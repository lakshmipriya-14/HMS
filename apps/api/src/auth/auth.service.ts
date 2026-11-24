import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthSessionSummaryDto, LoginResponseDto } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ACCESS_TOKEN_SECONDS, REFRESH_TOKEN_MS } from './auth-config';
import { resolveAccess } from './access-context';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

export const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export const isToken = (token?: string) => !!token && /^[A-Za-z0-9_-]{43}$/.test(token);
const invalidSession = () => new UnauthorizedException('Invalid or expired session.');
const invalidLogin = () => new UnauthorizedException('Invalid email or password.');

export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

export async function revokeCredentials(tx: Prisma.TransactionClient, userId: string) {
  const revokedAt = new Date();
  await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt } });
  await tx.passwordResetChallenge.updateMany({ where: { userId, revokedAt: null, consumedAt: null }, data: { revokedAt } });
  await tx.accountAccessToken.updateMany({ where: { userId, revokedAt: null, redeemedAt: null }, data: { revokedAt } });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new BadRequestException('Use at least 12 characters and at most 72 UTF-8 bytes.');
  }
  return bcrypt.hash(password, 12);
}

@Injectable()
export class AuthService {
  private static cachedDummyHash: Promise<string> | null = null;

  private get dummyHash(): Promise<string> {
    if (!AuthService.cachedDummyHash) {
      AuthService.cachedDummyHash = bcrypt.hash(randomToken(), 4);
    }
    return AuthService.cachedDummyHash;
  }

  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const account = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() }, select: { id: true, passwordHash: true },
    });
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw invalidLogin();
    const valid = await bcrypt.compare(dto.password, account?.passwordHash ?? await this.dummyHash);
    if (!account || !valid) throw invalidLogin();
    return this.prisma.$transaction(async tx => {
      await lockUser(tx, account.id);
      const current = await tx.user.findUnique({ where: { id: account.id }, select: { passwordHash: true } });
      if (current?.passwordHash !== account.passwordHash) throw invalidLogin();
      const user = await resolveAccess(tx, account.id);
      await tx.user.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
      await tx.auditLog.create({ data: {
        hospitalId: user.hospitalId, branchId: user.branchId, userId: user.id,
        userEmail: user.email, userRole: user.role, action: 'LOGIN', resource: 'AUTH', resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
      } });
      return (await this.issue(tx, user, randomUUID(), new Date(Date.now() + REFRESH_TOKEN_MS))).response;
    });
  }

  async refreshToken(token?: string): Promise<LoginResponseDto> {
    if (!isToken(token)) throw invalidSession();
    const digest = tokenDigest(token);
    const known = await this.prisma.refreshToken.findUnique({ where: { tokenHash: digest }, select: { userId: true } });
    if (!known) throw invalidSession();
    const response = await this.prisma.$transaction(async tx => {
      await lockUser(tx, known.userId);
      const old = await tx.refreshToken.findUnique({ where: { tokenHash: digest } });
      if (!old || old.expiresAt.getTime() <= Date.now()) return null;
      if (old.revokedAt) {
        if (old.replacedById) await tx.refreshToken.updateMany({
          where: { userId: old.userId, familyId: old.familyId, revokedAt: null }, data: { revokedAt: new Date() },
        });
        return null;
      }
      const user = await resolveAccess(tx, old.userId);
      if (user.hospitalId !== old.hospitalId) return null;
      const issued = await this.issue(tx, user, old.familyId, old.expiresAt);
      await tx.refreshToken.update({ where: { id: old.id }, data: { revokedAt: new Date(), replacedById: issued.id } });
      return issued.response;
    });
    if (!response) throw invalidSession();
    return response;
  }

  async logout(token?: string): Promise<void> {
    if (!isToken(token)) return;
    const lookup = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: tokenDigest(token) }, select: { userId: true, familyId: true },
    });
    if (!lookup) return;
    await this.prisma.$transaction(async tx => {
      await lockUser(tx, lookup.userId);
      await tx.refreshToken.updateMany({ where: { ...lookup, revokedAt: null }, data: { revokedAt: new Date() } });
    });
  }

  async listSessions(user: LoginResponseDto['user']): Promise<AuthSessionSummaryDto[]> {
    if (!user.hospitalId) throw invalidSession();
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId: user.id, hospitalId: user.hospitalId, replacedById: null },
      select: { id: true, createdAt: true, expiresAt: true, revokedAt: true },
      orderBy: { createdAt: 'desc' }, take: 10,
    });
    const now = Date.now();
    return rows.map(row => ({
      id: row.id, issuedAt: row.createdAt.toISOString(), expiresAt: row.expiresAt.toISOString(),
      status: row.revokedAt ? 'REVOKED' : row.expiresAt.getTime() <= now ? 'EXPIRED' : 'ACTIVE',
    }));
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!account || Buffer.byteLength(dto.currentPassword, 'utf8') > 72
      || !(await bcrypt.compare(dto.currentPassword, account.passwordHash))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.$transaction(async tx => {
      await lockUser(tx, userId);
      const result = await tx.user.updateMany({
        where: { id: userId, passwordHash: account.passwordHash, isActive: true, deletedAt: null }, data: { passwordHash },
      });
      if (!result.count) throw invalidSession();
      await revokeCredentials(tx, userId);
    });
  }

  private async issue(tx: Prisma.TransactionClient, user: LoginResponseDto['user'], familyId: string, expiresAt: Date) {
    if (!user.hospitalId) throw invalidSession();
    const refreshToken = randomToken();
    const { id } = await tx.refreshToken.create({
      data: { userId: user.id, hospitalId: user.hospitalId, tokenHash: tokenDigest(refreshToken), familyId, expiresAt },
      select: { id: true },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: familyId, kind: 'access' });
    return { id, response: { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_SECONDS, user } };
  }
}
