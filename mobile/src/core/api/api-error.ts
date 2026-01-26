/**
 * Tipos de error de API
 */
export interface ApiErrorData {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Clase de error personalizada para errores de API
 * Permite manejar errores de forma tipada y consistente
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;
  public readonly code?: string;

  constructor(message: string, statusCode: number, data?: Partial<ApiErrorData>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = data?.errors;
    this.code = data?.code;
  }

  /**
   * Verifica si es un error de autenticación
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Verifica si es un error de validación
   */
  isValidationError(): boolean {
    return this.statusCode === 422;
  }

  /**
   * Verifica si es un error del servidor
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Obtiene el primer error de validación para un campo
   */
  getFieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  /**
   * Crea un ApiError desde una respuesta de error del servidor
   */
  static fromResponse(statusCode: number, data: ApiErrorData): ApiError {
    return new ApiError(data.message || 'Error en la solicitud', statusCode, data);
  }
}
