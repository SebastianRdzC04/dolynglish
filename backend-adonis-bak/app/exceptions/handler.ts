import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // VineJS validation errors
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send({
        message: 'Validation failed',
        errors: error.messages,
      })
    }

    // AdonisJS errors with status/code (auth, route not found, etc.)
    if (error instanceof Error && 'status' in error) {
      const status = (error as Error & { status: number }).status
      const message = error.message || 'An error occurred'

      return ctx.response.status(status).send({
        message,
        ...(this.debug && { stack: error.stack }),
      })
    }

    // Fallback for unknown errors
    if (error instanceof Error) {
      return ctx.response.status(500).send({
        message: 'Internal server error',
        ...(this.debug && { error: error.message, stack: error.stack }),
      })
    }

    return ctx.response.status(500).send({
      message: 'Internal server error',
    })
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
