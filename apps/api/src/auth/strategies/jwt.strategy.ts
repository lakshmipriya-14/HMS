import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveAccess } from '../access-context';
import { jwtSecret } from '../auth-config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['HS256'], secretOrKey: jwtSecret(), issuer: 'uyirinai-hms', audience: 'uyirinai-staff',
    });
  }

  async validate(payload: { sub?: string; sid?: string; kind?: string }) {
    if (payload.kind !== 'access' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Invalid session.');
    }
    const session = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, familyId: payload.sid, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { hospitalId: true },
    });
    if (!session) throw new UnauthorizedException('Invalid or expired session.');
    const user = await resolveAccess(this.prisma, payload.sub);
    if (session.hospitalId !== user.hospitalId) throw new UnauthorizedException('Invalid session.');
    return user;
  }
}
