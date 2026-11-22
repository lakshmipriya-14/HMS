import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /^(replace|change|placeholder|example|your)[_-]/i.test(secret)) {
    throw new Error('JWT_SECRET must be configured with at least 32 random characters.');
  }
  return secret;
}

export const ACCESS_TOKEN_SECONDS = 900;
export const REFRESH_TOKEN_MS = 7 * 86_400_000;

export interface OtpDelivery {
  readonly mode: 'development' | 'delivery';
  generate(): string;
  deliver(email: string, otp: string): Promise<void>;
}
export const OTP_DELIVERY = Symbol('OTP_DELIVERY');

@Injectable()
export class ConfiguredOtpDelivery implements OtpDelivery {
  readonly mode: OtpDelivery['mode'];
  private readonly developmentCode?: string;

  constructor() {
    if (process.env.AUTH_DEV_OTP_ENABLED === 'true') {
      if (!['development', 'test'].includes(process.env.NODE_ENV || '')
        || !['127.0.0.1', '::1', 'localhost', '0.0.0.0'].includes(process.env.API_HOST || '')
        || process.env.AUTH_DEV_OTP !== '123456') {
        throw new Error('Development OTP requires a development/test environment, loopback API_HOST, and AUTH_DEV_OTP=123456.');
      }
      this.developmentCode = process.env.AUTH_DEV_OTP;
    }
    this.mode = this.developmentCode ? 'development' : 'delivery';
  }

  generate(): string {
    if (!this.developmentCode) throw new ServiceUnavailableException('Password reset delivery is unavailable.');
    return this.developmentCode;
  }

  async deliver(_email: string, _otp: string): Promise<void> {
    if (!this.developmentCode) throw new ServiceUnavailableException('Password reset delivery is unavailable.');
  }
}
