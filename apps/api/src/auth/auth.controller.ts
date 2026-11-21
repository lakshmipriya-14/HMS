import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto, SwitchRoleDto } from './dto/login.dto';
import { Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserDto } from '@multispeciality-hms/contracts';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with hospital credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const data = await this.authService.login(loginDto, ip);
    return {
      message: 'Login successful. Welcome to Kizuna Multispeciality Hospital.',
      data,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(dto.refreshToken);
    return {
      message: 'Token refreshed successfully',
      data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile & permissions' })
  async getMe(@CurrentUser() user: AuthUserDto) {
    return {
      message: 'User profile retrieved',
      data: user,
    };
  }

  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active workspace role' })
  async switchRole(
    @CurrentUser('id') userId: string,
    @Body() dto: SwitchRoleDto,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const data = await this.authService.switchRole(userId, dto.role, ip);
    return {
      message: `Active workspace role switched to ${dto.role}`,
      data,
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto
  ) {
    await this.authService.changePassword(userId, dto);
    return {
      message: 'Password changed successfully',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke active session' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return {
      message: 'Logged out successfully',
    };
  }
}
