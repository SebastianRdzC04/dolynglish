import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator } from '#validators/auth'
import User from '#models/user'
import { createUserValidator } from '#validators/user'
import UsersService from '#services/user.service'
import { inject } from '@adonisjs/core'
import type { ApiResponse } from '../types/api_response.js'

@inject()
export default class AuthController {
  constructor(private userService: UsersService) {}

  async login({ request, response, auth }: HttpContext) {
    const payload = await loginValidator.validate(request.all())

    try {
      const user = await User.verifyCredentials(payload.email, payload.password)

      if (!user) {
        return response.unauthorized({
          message: 'Invalid email or password',
        })
      }

      const token = await auth.use('api').createToken(user)

      return response.ok({
        message: 'Login successful',
        data: {
          user: user.toProfileDto(),
          token,
        },
      } as ApiResponse)
    } catch (error) {
      return response.badRequest({
        message: 'Failed to login',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  async register({ request, response }: HttpContext) {
    const payload = await createUserValidator.validate(request.all())

    try {
      const userExists = await this.userService.getByEmail(payload.email)

      if (userExists) {
        return response.conflict({
          message: 'User already exists',
        })
      }

      const user = await this.userService.create(payload)

      return response.created({
        message: 'User registered successfully',
        data: user,
      } as ApiResponse)
    } catch (error) {
      return response.badRequest({
        message: 'Failed to register user',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Revoke the current access token (logout).
   * POST /auth/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    const token = auth.user?.currentAccessToken

    if (token) {
      await User.accessTokens.delete(user, token.identifier)
    }

    return response.ok({
      message: 'Logged out successfully',
      data: null,
    } as ApiResponse)
  }

  /**
   * Return the authenticated user's profile.
   * GET /auth/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.ok({
      message: 'Authenticated user retrieved successfully',
      data: user.toProfileDto(),
    } as ApiResponse)
  }
}
