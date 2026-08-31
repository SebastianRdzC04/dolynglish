import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/errors/api-error.dto';
import {
  AuthResponseDto,
  AuthTokensDto,
  AuthUserViewDto,
} from '../../common/types/api-response.dto';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { apiOk, type ApiResponse } from '../../common/types/api-response.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account and return access + refresh tokens' })
  @ApiCreatedResponse({
    description: 'User registered. Returns the public user profile plus an access/refresh token pair.',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({ description: 'Email already in use', type: ApiErrorDto })
  @ApiBadRequestResponse({ description: 'Validation failed', type: ApiErrorDto })
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.auth.register(dto);
    return apiOk('User registered successfully', result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password' })
  @ApiOkResponse({
    description: 'Returns the user profile plus a fresh access/refresh token pair.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials', type: ApiErrorDto })
  @ApiBadRequestResponse({ description: 'Validation failed', type: ApiErrorDto })
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const result = await this.auth.login(dto);
    return apiOk('Login successful', result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh pair' })
  @ApiOkResponse({
    description: 'Returns a fresh access/refresh token pair.',
    type: AuthTokensDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token', type: ApiErrorDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<ApiResponse<AuthTokensDto>> {
    const tokens = await this.auth.refresh(dto.refreshToken);
    return apiOk('Token refreshed', tokens);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout the current user (client should drop the tokens)' })
  @ApiBearerAuth('access-token')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async logout(@CurrentUser() current: AuthUser): Promise<ApiResponse<null>> {
    await this.auth.logout(current.id);
    return apiOk('Logged out', null);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Return the current user’s public profile' })
  @ApiOkResponse({ description: 'The current user’s public profile.', type: AuthUserViewDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async me(@CurrentUser() current: AuthUser): Promise<ApiResponse<AuthUserViewDto>> {
    const user = await this.auth.me(current.id);
    return apiOk('Current user', user);
  }
}
