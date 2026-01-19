// Tipos para las respuestas de la API de autenticación

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Token {
  type: string;
  name: string | null;
  token: string;
  abilities: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: Token;
  };
}

export interface RegisterResponse {
  message: string;
  data: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
