/**
 * Tipos para autenticación
 */

/**
 * Datos del usuario autenticado
 */
export interface User {
  id: number;
  fullName: string;
  email: string;
  currentStreak?: number;
  lastStreakDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Token de acceso
 */
export interface AuthToken {
  type: string;
  name: string | null;
  token: string;
  abilities: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
}

/**
 * Respuesta del endpoint de login
 */
export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: AuthToken;
  };
}

/**
 * Respuesta del endpoint de registro
 */
export interface RegisterResponse {
  message: string;
  data: User;
}

/**
 * Credenciales para iniciar sesión
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Credenciales para registro
 */
export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: User | null;
  session: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
