import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import StreakService from '#services/streak.service'
import type { ApiResponse } from '../types/api_response.js'
import type { StreakResponse, UserProfileResponse } from '../types/streak.js'

@inject()
export default class UserController {
  constructor(private streakService: StreakService) {}

  /**
   * Obtiene el perfil del usuario autenticado
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
   * Obtiene los datos de racha del usuario autenticado
   * GET /user/streak
   * 
   * Query params opcionales:
   * - days: número de días de historial (default 10, max 30)
   */
  async getStreak({ request, response, auth }: HttpContext) {
    const user = auth.user!

    // Obtener días de historial del query string (default 10, max 30)
    const daysParam = request.qs().days
    let historyDays = 10

    if (daysParam) {
      const parsed = Number.parseInt(daysParam, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        historyDays = Math.min(parsed, 30) // Máximo 30 días
      }
    }

    try {
      const streakData = await this.streakService.getStreakData(user.id, historyDays)

      return response.ok({
        message: 'Streak data retrieved successfully',
        data: streakData,
      } as ApiResponse<StreakResponse>)
    } catch (error) {
      console.error('Error getting streak data:', error)
      return response.internalServerError({
        message: 'Failed to retrieve streak data',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Obtiene el perfil completo con datos de racha incluidos
   * GET /user/me
   * 
   * Combina perfil y streak en una sola respuesta para optimizar requests del móvil
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
      console.error('Error getting user data:', error)
      return response.internalServerError({
        message: 'Failed to retrieve user data',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
