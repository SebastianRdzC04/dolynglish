import {
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  ApiError,
} from "@/types/auth";

const API_BASE_URL = "https://apidoly.luzna.art";

class AuthService {
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || "Error en la solicitud");
    }

    return data as T;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }
}

export const authService = new AuthService();
