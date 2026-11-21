import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { jwtSecret, OTP_DELIVERY, OtpDelivery } from './auth-config';
import { hashPassword, isToken, lockUser, randomToken, revokeCredentials, tokenDigest } from './auth.service';

const MINUTE = 60_000;
const MAX_ATTEMPTS = 5;
const invalid = () => new BadRequestException('The recovery code or session is invalid or expired.');
const equalHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

@Injectable()
export class PasswordRecoveryService {
  constructor(private readonly prisma: PrismaService, @Inject(OTP_DELIVERY) private readonly delivery: OtpDelivery) {}

  async request(email: string) {
    const otp = this.delivery.generate();
    if (!/^\d{6}$/.test(otp) || (this.delivery.mode !== 'development' && otp === '123456')) {
      throw new ServiceUnavailableException('Password reset delivery is unavailable.');
    }
    const address = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: address, isActive: true, deletedAt: null, hospital: { code: 'UYIRINAI', isActive: true, deletedAt: null } },
      select: { id: true, email: true, hospitalId: true },
    });
    if (user) {
      const challenge = await this.prisma.$transaction(async tx => {
        await lockUser(tx, user.id);
        if (!await this.active(tx, user.id, user.hospitalId, address)) return null;
        const now = Date.now();
        const recent = await tx.passwordResetChallenge.count({
          where: { userId: user.id, requestedAt: { gte: new Date(now - 60 * MINUTE) } },
        });
        const last = await tx.passwordResetChallenge.findFirst({
          where: { userId: user.id, requestedAt: { gte: new Date(now - MINUTE) } }, select: { id: true },
        });
        if (last || recent >= 5) return null;
        await tx.passwordResetChallenge.updateMany({
          where: { userId: user.id, revokedAt: null, consumedAt: null }, data: { revokedAt: new Date(now) },
        });
        return tx.passwordResetChallenge.create({
          data: {
            userId: user.id, hospitalId: user.hospitalId, channel: this.delivery.mode,
            destinationHash: this.digest('address', address), otpHash: this.digest(user.id, otp),
            expiresAt: new Date(now + 10 * MINUTE),
          },
          select: { id: true },
        });
      });
      if (challenge) {
        try {
          await this.delivery.deliver(user.email, otp);
        } catch {
          await this.prisma.passwordResetChallenge.updateMany({
            where: { id: challenge.id, revokedAt: null }, data: { revokedAt: new Date() },
          });
          // Keep the public response uniform. Alerting belongs in the delivery adapter.
        }
      }
    }
    return { mode: this.delivery.mode };
  }

  async verify(email: string, otp: string) {
    const address = email.trim().toLowerCase();
    const digest = this.digest('address', address);
    const found = await this.prisma.passwordResetChallenge.findFirst({
      where: { destinationHash: digest, purpose: 'RESET' }, orderBy: { requestedAt: 'desc' },
      select: { id: true, userId: true },
    });
    if (!found) throw invalid();
    const proof = await this.prisma.$transaction(async tx => {
      await lockUser(tx, found.userId);
      const current = await tx.passwordResetChallenge.findUnique({ where: { id: found.id } });
      if (!current || current.verifiedAt || current.revokedAt || current.consumedAt
        || current.attemptCount >= MAX_ATTEMPTS || current.expiresAt.getTime() <= Date.now()
        || current.channel !== this.delivery.mode
        || !await this.active(tx, current.userId, current.hospitalId, address)) return null;
      const allowedOtp = this.delivery.mode === 'development' || otp !== '123456';
      const matches = allowedOtp && equalHash(this.digest(current.userId, otp), current.otpHash);
      if (!matches) {
        await tx.passwordResetChallenge.update({
          where: { id: current.id },
          data: { attemptCount: { increment: 1 }, revokedAt: current.attemptCount + 1 >= MAX_ATTEMPTS ? new Date() : undefined },
        });
        return null;
      }
      const token = randomToken();
      await tx.passwordResetChallenge.update({
        where: { id: current.id },
        data: { otpHash: tokenDigest(token), verifiedAt: new Date() },
      });
      return { challengeId: current.id, resetToken: token };
    });
    if (!proof) throw invalid();
    return proof;
  }

  async reset(challengeId: string, token: string, password: string) {
    if (!isToken(token)) throw invalid();
    const found = await this.prisma.passwordResetChallenge.findUnique({ where: { id: challengeId } });
    if (!found || !found.verifiedAt || found.consumedAt || found.revokedAt
      || found.channel !== this.delivery.mode || found.expiresAt.getTime() <= Date.now()
      || !equalHash(found.otpHash, tokenDigest(token))) throw invalid();
    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction(async tx => {
      await lockUser(tx, found.userId);
      if (!await this.active(tx, found.userId, found.hospitalId)) throw invalid();
      const used = await tx.passwordResetChallenge.updateMany({
        where: { id: challengeId, verifiedAt: { not: null }, revokedAt: null, consumedAt: null,
          expiresAt: { gt: new Date() }, otpHash: tokenDigest(token), channel: this.delivery.mode, purpose: 'RESET' },
        data: { consumedAt: new Date() },
      });
      if (!used.count) throw invalid();
      await tx.user.update({ where: { id: found.userId }, data: { passwordHash } });
      await revokeCredentials(tx, found.userId);
    });
  }

  async redeem(token: string, password: string) {
    if (!isToken(token)) throw invalid();
    const digest = tokenDigest(token);
    const found = await this.prisma.accountAccessToken.findUnique({ where: { digest } });
    if (!found || found.revokedAt || found.redeemedAt || found.expiresAt.getTime() <= Date.now()) throw invalid();
    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction(async tx => {
      await lockUser(tx, found.userId);
      if (!await this.active(tx, found.userId, found.hospitalId)) throw invalid();
      const used = await tx.accountAccessToken.updateMany({
        where: { digest, expiresAt: { gt: new Date() }, revokedAt: null, redeemedAt: null },
        data: { redeemedAt: new Date() },
      });
      if (!used.count) throw invalid();
      await tx.user.update({ where: { id: found.userId }, data: { passwordHash } });
      await revokeCredentials(tx, found.userId);
    });
  }

  private active(tx: Prisma.TransactionClient, userId: string, hospitalId: string, email?: string) {
    return tx.user.findFirst({
      where: { id: userId, hospitalId, email, deletedAt: null, isActive: true,
        hospital: { code: 'UYIRINAI', isActive: true, deletedAt: null } },
      select: { id: true },
    });
  }

  private digest(context: string, value: string) {
    return createHmac('sha256', jwtSecret()).update(JSON.stringify(['uyirinai-recovery', context, value])).digest('hex');
  }
}
