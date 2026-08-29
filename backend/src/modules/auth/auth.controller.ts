import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { apiOk, type ApiResponse } from '../../common/types/api-response.type';
import type { AuthTokens, AuthUserView } from './auth.types';

interface AuthResponse {
  user: AuthUserView;
  tokens: AuthTokens;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account and return access + refresh tokens' })
  @ApiCreatedResponse({ description: 'User registered' })
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResponse>> {
    const result = await this.auth.register(dto);
    return apiOk('User registered successfully', result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password' })
  @ApiOkResponse({ description: 'Returns user + tokens' })
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    const result = await this.auth.login(dto);
    return apiOk('Login successful', result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh pair' })
  @ApiOkResponse({ description: 'New tokens' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<ApiResponse<AuthTokens>> {
    const tokens = await this.auth.refresh(dto.refreshToken);
    return apiOk('Token refreshed', tokens);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout the current user (client should drop the tokens)' })
  async logout(@CurrentUser() current: AuthUser): Promise<ApiResponse<null>> {
    await this.auth.logout(current.id);
    return apiOk('Logged out', null);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Return the current user’s public profile' })
  @ApiOkResponse({ description: 'Current user' })
  async me(@CurrentUser() current: AuthUser): Promise<ApiResponse<AuthUserView>> {
    const user = await this.auth.me(current.id);
    return apiOk('Current user', user);
  }
}
