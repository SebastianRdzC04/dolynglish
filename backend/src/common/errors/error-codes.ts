/**
 * Canonical error codes for the Dolynglish API.
 *
 * Every error returned to the client uses one of these codes. The string value
 * (not the TS enum number) is what the client sees, so we can add or rename
 * codes without breaking compatibility.
 *
 * Conventions:
 *   - 4xx codes = client did something wrong
 *   - 5xx codes = server side issue (the client did nothing wrong)
 *   - NEVER leak internal details (SQL strings, file paths, secrets) into the
 *     `message` field. The full error is logged server-side; the client gets
 *     a generic, safe message plus a stable code.
 */
export enum ErrorCode {
  // === Auth (4xx) ===
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_PASSWORD_TOO_WEAK = 'AUTH_PASSWORD_TOO_WEAK',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',

  // === Resources (4xx) ===
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN',

  // === Readings domain (4xx) ===
  READING_PENDING_LIMIT_REACHED = 'READING_PENDING_LIMIT_REACHED',
  READING_ALREADY_EVALUATED = 'READING_ALREADY_EVALUATED',

  // === Validation (4xx) ===
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // === Server (5xx) ===
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorMeta {
  code: ErrorCode;
  /** HTTP status code, returned to the client. */
  status: number;
  /** Human-readable message, safe to expose. NEVER includes SQL, paths, or secrets. */
  message: string;
}

/**
 * The full catalogue. Every ErrorCode MUST have an entry here.
 * Tests in error-codes.spec.ts assert this exhaustively.
 */
export const ErrorCatalog: Record<ErrorCode, ErrorMeta> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    status: 401,
    message: 'Invalid email or password',
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
    status: 401,
    message: 'Authentication token has expired',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    code: ErrorCode.AUTH_TOKEN_INVALID,
    status: 401,
    message: 'Authentication token is invalid',
  },
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: {
    code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
    status: 409,
    message: 'An account with that email already exists',
  },
  [ErrorCode.AUTH_PASSWORD_TOO_WEAK]: {
    code: ErrorCode.AUTH_PASSWORD_TOO_WEAK,
    status: 400,
    message: 'Password does not meet the minimum strength requirements',
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    code: ErrorCode.AUTH_UNAUTHORIZED,
    status: 401,
    message: 'Authentication is required to access this resource',
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    status: 404,
    message: 'The requested resource was not found',
  },
  [ErrorCode.RESOURCE_FORBIDDEN]: {
    code: ErrorCode.RESOURCE_FORBIDDEN,
    status: 403,
    message: 'You do not have permission to access this resource',
  },
  [ErrorCode.READING_PENDING_LIMIT_REACHED]: {
    code: ErrorCode.READING_PENDING_LIMIT_REACHED,
    status: 400,
    message: 'You have reached the maximum number of pending readings. Complete or delete some before generating more.',
  },
  [ErrorCode.READING_ALREADY_EVALUATED]: {
    code: ErrorCode.READING_ALREADY_EVALUATED,
    status: 400,
    message: 'This reading has already been evaluated and cannot be modified',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    status: 400,
    message: 'The request data did not pass validation. See details for the specific fields.',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    status: 500,
    message: 'An unexpected error occurred. Please try again later.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    status: 503,
    message: 'The service is temporarily unavailable. Please try again later.',
  },
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ErrorCode).includes(value as ErrorCode);
}

export function getErrorMeta(code: ErrorCode): ErrorMeta {
  return ErrorCatalog[code] ?? ErrorCatalog[ErrorCode.INTERNAL_ERROR];
}