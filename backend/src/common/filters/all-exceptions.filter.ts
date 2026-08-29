import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { apiFail, type ApiResponse } from '../types/api-response.type';

/**
 * Catches ALL thrown errors and returns a consistent envelope:
 *   { message, data: null, error: { code, message, details? } }
 *
 * HTTP exceptions (thrown by NestJS built-ins or @nestjs/common) preserve their status code
 * and shape the error.code from the original exception name.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as { message?: unknown; error?: string; code?: string };
        message = Array.isArray(r.message) ? 'Validation failed' : (r.message as string) || message;
        code = r.code || r.error || exception.name;
        if (Array.isArray(r.message)) {
          details = { errors: r.message };
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name;
    }

    // Log server errors, not client errors
    if (status >= 500) {
      this.logger.error(
        {
          method: request.method,
          url: request.url,
          err: exception instanceof Error ? exception : new Error(String(exception)),
        },
        `${request.method} ${request.url} -> ${status} ${code}: ${message}`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} ${code}: ${message}`,
      );
    }

    const body: ApiResponse<null> = apiFail(code, message, details);
    response.status(status).json(body);
  }
}
