/**
 * Cliente HTTP base para comunicación con la API
 * Centraliza toda la lógica de peticiones HTTP
 */

import { ENV } from '../config/env';
import { STORAGE_KEYS } from '../config/constants';
import { secureStorage } from '../storage/secure-storage';
import { ApiError } from './api-error';

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Opciones para las peticiones HTTP
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: object;
  requiresAuth?: boolean;
}

/**
 * Cliente HTTP con manejo automático de autenticación y errores
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENV.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtiene el token de sesión almacenado
   */
  private async getAuthToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  /**
   * Realiza una petición HTTP a la API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, requiresAuth = true, ...fetchOptions } = options;

    // Construir headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Agregar token de autenticación si es requerido
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw ApiError.fromResponse(response.status, data);
      }

      return data as T;
    } catch (error) {
      // Re-lanzar ApiError sin modificar
      if (error instanceof ApiError) {
        throw error;
      }

      // Manejar errores de red/conexión de forma más descriptiva
      if (error instanceof TypeError) {
        // TypeError con 'fetch' indica problemas de red
        if (error.message.includes('Network request failed') || 
            error.message.includes('Failed to fetch')) {
          throw new ApiError(
            'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.',
            0,
            { code: 'NETWORK_ERROR' }
          );
        }
      }

      // Envolver otros errores
      if (error instanceof Error) {
        // Detectar errores de timeout
        if (error.name === 'AbortError') {
          throw new ApiError(
            'La solicitud tardó demasiado. Intenta de nuevo.',
            0,
            { code: 'TIMEOUT' }
          );
        }
        throw new ApiError(error.message, 0, { code: 'UNKNOWN_ERROR' });
      }

      throw new ApiError('Error de conexión', 0, { code: 'CONNECTION_ERROR' });
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: object, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: object, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: object, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requiresAuth });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

/**
 * Instancia singleton del cliente API
 */
export const apiClient = new ApiClient();
