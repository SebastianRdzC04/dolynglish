/**
 * Servicio de autenticación
 * Maneja todas las llamadas a la API relacionadas con auth
 */

import { apiClient } from '@/src/core/api';
import {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
} from '../types';

/**
 * Servicio para operaciones de autenticación
 */
class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials, false);
  }

  /**
   * Registra un nuevo usuario
   */
  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', credentials, false);
  }

  /**
   * Cierra la sesión actual (opcional - si el backend lo soporta)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorar errores de logout - limpiar sesión local de todos modos
    }
  }

  /**
   * Verifica si el token actual es válido
   */
  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
