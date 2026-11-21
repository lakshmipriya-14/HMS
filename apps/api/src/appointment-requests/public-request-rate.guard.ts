import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 8;
const MAX_SOURCES = 10_000;

@Injectable()
export class PublicRequestRateGuard implements CanActivate {
  private readonly sources = new Map<string, { expiresAt: number; count: number }>();
  private sweepAt = 0;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const source = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (now >= this.sweepAt) {
      for (const [key, window] of this.sources) {
        if (window.expiresAt <= now) this.sources.delete(key);
      }
      this.sweepAt = now + WINDOW_MS;
    }

    const current = this.sources.get(source);
    if (!current || current.expiresAt <= now) {
      if (current || this.sources.size < MAX_SOURCES) {
        this.sources.set(source, { expiresAt: now + WINDOW_MS, count: 1 });
        return true;
      }
    } else if (current.count < REQUEST_LIMIT) {
      current.count++;
      return true;
    }

    throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
  }
}
