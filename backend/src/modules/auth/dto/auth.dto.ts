import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

// Why `!` (definite assignment) instead of `?` (optional)?
// We want the DTO to fail validation loudly at the controller boundary
// if a field is missing, not silently accept undefined. The class-validator
// pipeline runs the constructor and then applies decorators; the
// `!` tells TypeScript "trust me, class-validator will populate this"
// (which it does — see https://github.com/typestack/class-validator).
