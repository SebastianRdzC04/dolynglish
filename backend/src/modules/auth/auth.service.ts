import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PromptLogService } from '../readings/prompt-log.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import type { IAuthService, AuthTokens, AuthUserView } from './auth.types';

interface JwtPayload {
  sub: number;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService implements IAuthService {
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    config: ConfigService,
    @Inject(PromptLogService) private readonly promptLogs: PromptLogService,
  ) {
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    this.refreshTtl = config.get<string>('JWT_REFRESH_TTL') ?? '30d';
  }

  async register(input: RegisterDto): Promise<{ user: AuthUserView; tokens: AuthTokens }> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictException({
        code: 'AUTH.EMAIL_TAKEN',
        message: 'An account with this email already exists',
      });
    }
    const created = await this.users.create({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
    });
    const tokens = await this.signTokensFor(created.id, created.email);
    await this.promptLogs.logAuthEvent('user_registered', created.id);
    return { user: this.users.toPublic(created), tokens };
  }

  async login(input: LoginDto): Promise<{ user: AuthUserView; tokens: AuthTokens }> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH.INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    const ok = await this.users.verifyPassword(input.password, user.password);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'AUTH.INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    const tokens = await this.signTokensFor(user.id, user.email);
    await this.promptLogs.logAuthEvent('user_login', user.id);
    return { user: this.users.toPublic(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH.INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'AUTH.INVALID_REFRESH_TOKEN',
        message: 'Token is not a refresh token',
      });
    }
    return this.signTokensFor(payload.sub, payload.email);
  }

  async logout(_userId: number): Promise<void> {
    // Stateless JWT — logout is a no-op on the server. The mobile client drops the tokens.
    // A future enhancement could maintain a revocation list in Redis.
    return Promise.resolve();
  }

  async me(userId: number): Promise<AuthUserView> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH.USER_NOT_FOUND',
        message: 'User no longer exists',
      });
    }
    return this.users.toPublic(user);
  }

  private async signTokensFor(userId: number, email: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, type: 'access' } satisfies JwtPayload,
      { expiresIn: this.accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, type: 'refresh' } satisfies JwtPayload,
      { expiresIn: this.refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
