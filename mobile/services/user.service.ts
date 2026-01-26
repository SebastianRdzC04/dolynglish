// Servicio para endpoints de usuario y streak
import { apiService, ApiResponse } from "./api.service";
import { StreakResponse, UserProfile, UserMeResponse } from "@/types/streak";

class UserService {
  /**
   * Obtiene el perfil del usuario autenticado
   * GET /user/profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiService.get<ApiResponse<UserProfile>>("/user/profile");
    return response.data;
  }

  /**
   * Obtiene los datos de racha del usuario
   * GET /user/streak
   * @param days - Número de días de historial (default 10, max 30)
   */
  async getStreak(days: number = 10): Promise<StreakResponse> {
    const response = await apiService.get<ApiResponse<StreakResponse>>(
      `/user/streak?days=${days}`
    );
    return response.data;
  }

  /**
   * Obtiene perfil + streak combinados (optimizado para carga inicial)
   * GET /user/me
   */
  async getMe(): Promise<UserMeResponse> {
    const response = await apiService.get<ApiResponse<UserMeResponse>>("/user/me");
    return response.data;
  }
}

export const userService = new UserService();
