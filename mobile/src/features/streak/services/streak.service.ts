/**
 * Servicio de streak
 * Maneja llamadas a la API relacionadas con el streak del usuario
 */

import { apiClient, ApiResponse } from '@/src/core/api';
import { StreakResponse } from '../types';

/**
 * Servicio para operaciones de streak
 */
class StreakService {
  /**
   * Obtiene los datos de racha del usuario
   * @param days - Número de días de historial (default 10, max 30)
   */
  async getStreak(days: number = 10): Promise<StreakResponse> {
    const response = await apiClient.get<ApiResponse<StreakResponse>>(
      `/user/streak?days=${days}`
    );
    return response.data;
  }
}

export const streakService = new StreakService();
