import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import StreakService from '#services/streak.service'
import { streakQueryValidator } from '#validators/reading'
import type { ApiResponse } from '../types/api_response.js'
import type { StreakResponse, UserProfileResponse } from '../types/streak.js'

@inject()
export default class UserController {
  constructor(private streakService: StreakService) {}

  /**
   * Get the authenticated user's profile.
   * GET /user/profile
   */
  async getProfile({ response, auth }: HttpContext) {
    const user = auth.user!

    return response.ok({
      message: 'Profile retrieved successfully',
      data: user.toProfileDto(),
    } as ApiResponse<UserProfileResponse>)
  }

  /**
   * Get the authenticated user's streak data.
   * GET /user/streak
   *
   * Query params:
   * - days: number of history days (optional, default 10, max 30)
   */
  async getStreak({ request, response, auth }: HttpContext) {
    const user = auth.user!

    // Validate query params through VineJS
    const { days } = await streakQueryValidator.validate(request.qs())
    const historyDays = days ?? 10

    try {
      const streakData = await this.streakService.getStreakData(user.id, historyDays)

      return response.ok({
        message: 'Streak data retrieved successfully',
        data: streakData,
      } as ApiResponse<StreakResponse>)
    } catch (error) {
      logger.error({ err: error }, 'Error getting streak data')
      return response.internalServerError({
        message: 'Failed to retrieve streak data',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get full profile with streak data combined.
   * GET /user/me
   *
   * Combines profile and streak in a single response to optimise mobile requests.
   */
  async getMe({ response, auth }: HttpContext) {
    const user = auth.user!

    try {
      const streakData = await this.streakService.getStreakData(user.id, 10)

      return response.ok({
        message: 'User data retrieved successfully',
        data: {
          profile: user.toProfileDto(),
          streak: streakData,
        },
      } as ApiResponse<{ profile: UserProfileResponse; streak: StreakResponse }>)
    } catch (error) {
      logger.error({ err: error }, 'Error getting user data')
      return response.internalServerError({
        message: 'Failed to retrieve user data',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
