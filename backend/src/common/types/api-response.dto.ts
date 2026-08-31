/**
 * OpenAPI response envelope DTOs.
 *
 * The live API returns `{ message, data, error? }` on every endpoint. The
 * Nest controllers already use the runtime helper `apiOk(message, data)` /
 * `apiFail(code, message, details)` from `api-response.type.ts`. These
 * DTOs exist SOLELY to feed the OpenAPI generator (SwaggerModule) so
 * Scalar renders the documented success envelope with the actual `data`
 * shape for every endpoint.
 *
 * Design notes
 * ------------
 * - We do NOT subclass or compose with the runtime `ApiResponse<T>`
 *   interface from `api-response.type.ts`: that would create a circular
 *   dependency between the runtime helper and the OpenAPI DTO module.
 *   Instead, these DTOs are a structural mirror used only by the
 *   document builder.
 * - The `data` field is typed as an opaque object; the concrete schema is
 *   supplied by the controller via `schema: { $ref: '#/components/schemas/<DtoName>' }`
 *   on each `@ApiOkResponse({ type, schema })` decoration. Nest merges
 *   the type and the schema in the final spec.
 * - For 204 No Content endpoints, the body is omitted entirely; see
 *   `ApiNoContentResponseDto` for documentation-only purposes.
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic success envelope. The `data` property is documented on a
 * per-endpoint basis via the `schema` field of `@ApiOkResponse`.
 *
 * Example on a controller:
 *   @ApiOkResponse({
 *     description: 'Returns user + tokens',
 *     type: ApiSuccessEnvelopeDto,
 *     schema: { allOf: [{ $ref: getSchemaPath(AuthResponseDto) }] },
 *   })
 *
 * The runtime shape matches the live API contract: `{ message: string, data: T, error: null }`.
 */
export class ApiSuccessEnvelopeDto<TData = unknown> {
  @ApiProperty({
    description: 'Human-readable success message, safe to display to end users',
    example: 'User registered successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Endpoint-specific payload. Its shape is defined by the per-endpoint `schema` reference.',
    type: 'object',
    additionalProperties: true,
  })
  data!: TData;

  @ApiProperty({
    description: 'Always `null` on success. Present (and non-null) on error.',
    example: null,
    nullable: true,
    default: null,
  })
  error!: null;
}

/**
 * Convenience class for endpoints that return no body (HTTP 204).
 * Documented for completeness; most callers just use `@HttpCode(204)`
 * without an explicit type.
 */
export class ApiNoContentResponseDto {
  @ApiProperty({
    description: 'No body is returned. This object is documented for completeness only.',
    example: {},
  })
  readonly noContent!: Record<string, never>;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Domain DTOs (the `data` shapes)
 *
 * Each DTO below is what the controller puts inside `data`. We define them
 * here so Scalar renders the documented shape without forcing controllers
 * to import from multiple module paths.
 *
 * Date fields are typed as `Date` (matching the runtime service return
 * types) — the OpenAPI spec still serialises them as ISO 8601 strings
 * thanks to `format: 'date-time'`, which is what JSON over the wire
 * actually contains.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Public user shape returned by /auth/register, /auth/login, and /auth/me.
 * Mirrors `PublicUser` from users.service.ts but with @ApiProperty so
 * the OpenAPI generator picks it up.
 */
export class AuthUserViewDto {
  @ApiProperty({ example: 13, description: 'Internal user id' })
  id!: number;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'Sebastián Rodríguez', nullable: true })
  fullName!: string | null;

  @ApiProperty({ example: 0, description: 'Current streak in days' })
  currentStreak!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'ISO date of last streak activity (null if never active)',
  })
  lastStreakDate!: string | null;

  @ApiProperty({ example: '2026-08-31T15:16:43.474Z', format: 'date-time' })
  createdAt!: Date;
}

/**
 * JWT tokens returned alongside authentication.
 */
export class AuthTokensDto {
  @ApiProperty({
    description: 'Short-lived JWT access token. Send as `Authorization: Bearer <token>`.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Long-lived JWT refresh token. Send to /auth/refresh to obtain a new pair.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Access-token lifetime in seconds.',
    example: 900,
  })
  expiresIn!: number;
}

/**
 * `data` shape for /auth/register (201) and /auth/login (200).
 */
export class AuthResponseDto {
  @ApiProperty({ type: () => AuthUserViewDto })
  user!: AuthUserViewDto;

  @ApiProperty({ type: () => AuthTokensDto })
  tokens!: AuthTokensDto;
}

/**
 * `data` shape for /auth/refresh (200).
 */
export class RefreshResponseDto {
  @ApiProperty({ type: () => AuthTokensDto })
  tokens!: AuthTokensDto;
}

/**
 * `data` shape for /auth/me (200).
 */
export class MeResponseDto {
  @ApiProperty({ type: () => AuthUserViewDto })
  user!: AuthUserViewDto;
}

/**
 * `data` shape for /readings/options (200).
 */
export class ReadingOptionsDto {
  @ApiProperty({
    type: [String],
    example: ['technology', 'history', 'education'],
    description: 'Available content categories',
  })
  categories!: string[];

  @ApiProperty({
    type: [String],
    example: ['easy', 'medium', 'hard'],
    description: 'Available difficulty levels',
  })
  difficulties!: string[];

  @ApiProperty({
    type: [String],
    example: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    description: 'Available CEFR levels (Common European Framework of Reference)',
  })
  cefrLevels!: string[];
}

/**
 * A reading entity as returned by /readings endpoints.
 * Mirrors the Drizzle `readings` table row but documented explicitly so
 * Scalar renders every field.
 */
export class ReadingDto {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty({ example: 7, description: 'Owning user id' })
  userId!: number;

  @ApiProperty({ example: 'The Rise of TypeScript' })
  title!: string;

  @ApiProperty({ example: 'How a small Microsoft project became the default for web backends.' })
  description!: string;

  @ApiProperty({ description: 'Full reading body in plain text.', example: 'TypeScript was first released in 2012...' })
  content!: string;

  @ApiProperty({ example: 'technology', nullable: true })
  category!: string | null;

  @ApiProperty({ example: 'medium', nullable: true })
  difficulty!: string | null;

  @ApiProperty({ example: 280, description: 'Word count of the generated reading', nullable: true })
  wordCount!: number | null;

  @ApiProperty({ example: 'pending', enum: ['pending', 'completed'] })
  status!: string;

  @ApiProperty({ example: 87, nullable: true, description: 'Set after evaluation; 0–100.' })
  score!: number | null;

  @ApiProperty({ example: null, nullable: true, description: 'Set after evaluation.' })
  feedback!: string | null;

  @ApiProperty({ example: false, nullable: true, description: 'true if score >= 80. null until evaluation.' })
  passed!: boolean | null;

  @ApiProperty({ example: '2026-08-31T15:16:43.474Z', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ example: null, nullable: true, format: 'date-time' })
  updatedAt!: Date | null;

  @ApiProperty({ example: null, nullable: true, format: 'date-time', description: 'Soft-delete timestamp.' })
  deletedAt!: Date | null;
}

/**
 * `data` shape for /readings/{id}/evaluate (200).
 */
export class EvaluationResultDto {
  @ApiProperty({ example: 87, minimum: 0, maximum: 100 })
  score!: number;

  @ApiProperty({ example: true, description: 'true if score >= 80' })
  passed!: boolean;

  @ApiProperty({
    example: 'Your summary captured the main point about TypeScript adoption.',
    description: 'AI-generated feedback for the user',
  })
  feedback!: string;

  @ApiProperty({ type: () => ReadingDto })
  reading!: ReadingDto;
}

/**
 * `data` shape for /readings/{id}/explanations (200).
 */
export class ExplanationResultDto {
  @ApiProperty({ example: 'In this context, "release" means publishing a new version of software.' })
  explanation!: string;

  @ApiProperty({ type: () => ReadingDto })
  reading!: ReadingDto;
}

/**
 * `data` shape for /ia/chat (200).
 */
export class ChatResponseDto {
  @ApiProperty({ example: 'TypeScript was first released in 2012 by Microsoft...' })
  text!: string;
}

/**
 * `data` shape for /health/live and /health/ready (200).
 * Mirrors the `@nestjs/terminus` HealthCheckResult shape.
 */
export class HealthCheckResultDto {
  @ApiProperty({
    description: 'Per-dependency status map. Keys are dependency identifiers (e.g. "app", "db").',
    type: 'object',
    additionalProperties: true,
    example: { app: { status: 'up', uptime: 12345.6 } },
  })
  info!: Record<string, { status: 'up' | 'down'; [k: string]: unknown }>;

  @ApiProperty({
    description: 'Same shape as `info`. Only populated when a check fails.',
    type: 'object',
    additionalProperties: true,
    example: {},
  })
  error!: Record<string, { status: 'up' | 'down'; [k: string]: unknown }>;

  @ApiProperty({
    description: '"up" if all checks passed, "down" otherwise.',
    enum: ['up', 'down'],
    example: 'up',
  })
  status!: 'up' | 'down';
}