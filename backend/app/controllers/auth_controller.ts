import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator } from '#validators/auth'
import User from '#models/user'
import { createUserValidator } from '#validators/user'
import UsersService from '#services/user.service'
import { inject } from '@adonisjs/core'

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
          user,
          token,
        },
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to login',
        error: error.message,
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

      // otorgar el rol de cliente por defecto

      const user = await this.userService.create(payload)

      return response.created({
        message: 'User registered successfully',
        data: user,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to register user',
        error: error.message,
      })
    }
  }
}
