// Servicio base para API con manejo automático de token
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ApiError } from "@/types/auth";

const API_BASE_URL = "https://apidoly.luzna.art";

/**
 * Obtiene el token de sesión almacenado
 */
async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("session");
      }
    } catch {
      return null;
    }
    return null;
  }
  return SecureStore.getItemAsync("session");
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Opciones para las peticiones
 */
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: object;
  requiresAuth?: boolean;
}

/**
 * Servicio base para peticiones a la API
 */
class ApiService {
  private baseUrl = API_BASE_URL;

  /**
   * Realiza una petición a la API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Agregar token de autenticación si es requerido
    if (requiresAuth) {
      const token = await getToken();
      if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || "Error en la solicitud");
    }

    return data as T;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", requiresAuth });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: object, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body, requiresAuth });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: object, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body, requiresAuth });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", requiresAuth });
  }
}

export const apiService = new ApiService();
