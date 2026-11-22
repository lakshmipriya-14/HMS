import { Body, Controller, ForbiddenException, Get, Header, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthUserDto, LoginResponseDto } from '@multispeciality-hms/contracts';
import { Request, Response } from 'express';
import { Public, Scoped } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { PasswordRecoveryService } from './password-recovery.service';
import { ChangePasswordDto, LoginDto, RecoveryEmailDto, RedeemAccessDto, RefreshTokenDto, ResetPasswordDto, VerifyOtpDto } from './dto/login.dto';
import { PublicRequestRateGuard } from '../appointment-requests/public-request-rate.guard';
import { REFRESH_TOKEN_MS } from './auth-config';

const cookieName = 'uyirinai_refresh';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/v1/auth' });

@Scoped()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly recovery: PasswordRecoveryService) {}

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = this.cookieMode(req);
    return this.session(await this.auth.login(dto), cookie, res);
  }

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = this.cookieMode(req);
    return this.session(await this.auth.refreshToken(cookie ? this.cookieToken(req) : dto.refreshToken), cookie, res);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  getMe(@CurrentUser() user: AuthUserDto) {
    return { message: 'Session verified.', data: user };
  }

  @Get('sessions')
  @Header('Cache-Control', 'no-store')
  async sessions(@CurrentUser() user: AuthUserDto) {
    return { message: 'Recent sessions retrieved.', data: await this.auth.listSessions(user) };
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
    await this.auth.changePassword(userId, dto);
    res.clearCookie(cookieName, cookieOptions());
    return { message: 'Password changed. Sign in again.' };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = this.cookieMode(req);
    await this.auth.logout(cookie ? this.cookieToken(req) : dto.refreshToken);
    if (cookie) res.clearCookie(cookieName, cookieOptions());
    return { message: 'Signed out.' };
  }

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('forgot-password')
  @HttpCode(200)
  async forgot(@Body() dto: RecoveryEmailDto) {
    const data = await this.recovery.request(dto.email);
    const message = data.mode === 'development' ? 'Local development recovery is enabled. No message was sent.'
      : 'If the account is eligible, a recovery code can be delivered.';
    return { message, data };
  }

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('verify-reset-otp')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async verify(@Body() dto: VerifyOtpDto) {
    return { message: 'Code verified.', data: await this.recovery.verify(dto.email, dto.otp) };
  }

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.recovery.reset(dto.challengeId, dto.resetToken, dto.newPassword);
    return { message: 'Password reset. Sign in again.' };
  }

  @Public()
  @UseGuards(PublicRequestRateGuard)
  @Post('account-access/redeem')
  @HttpCode(200)
  async redeem(@Body() dto: RedeemAccessDto) {
    await this.recovery.redeem(dto.code, dto.newPassword);
    return { message: 'Password set. Sign in to continue.' };
  }

  private cookieMode(req: Request) {
    if (req.get('x-hms-session') !== 'cookie') return false;
    const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8081').split(',').map(s => s.trim());
    if (!origins.includes(req.get('origin') || '')) throw new ForbiddenException('Untrusted session origin.');
    return true;
  }

  private cookieToken(req: Request) {
    return req.headers.cookie?.split(';').map(value => value.trim())
      .find(value => value.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  }

  private session(data: LoginResponseDto, cookie: boolean, res: Response) {
    if (cookie) res.cookie(cookieName, data.refreshToken, { ...cookieOptions(), maxAge: REFRESH_TOKEN_MS });
    return { message: 'Session issued.', data: cookie ? { ...data, refreshToken: '' } : data };
  }
}
