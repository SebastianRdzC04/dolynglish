/**
 * Contexto de autenticación
 * Provee estado de sesión y acciones de auth a toda la app
 */

import { createContext, useContext, useCallback, useMemo, type PropsWithChildren } from 'react';
import { useStorageState } from '@/src/shared/hooks';
import { STORAGE_KEYS } from '@/src/core/config';
import { authService } from '../services';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

/**
 * Tipo del contexto de autenticación
 */
interface AuthContextType {
  /** Token de sesión actual */
  session: string | null;
  /** Datos del usuario autenticado */
  user: User | null;
  /** Si está cargando el estado inicial */
  isLoading: boolean;
  /** Si hay una sesión activa */
  isAuthenticated: boolean;
  /** Inicia sesión */
  signIn: (credentials: LoginCredentials) => Promise<void>;
  /** Registra un nuevo usuario y lo autentica */
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  /** Cierra la sesión */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook para acceder al contexto de autenticación
 * @throws Error si se usa fuera del SessionProvider
 */
export function useSession(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

/**
 * Hook simplificado para verificar autenticación
 */
export function useAuth() {
  const { isAuthenticated, isLoading, user } = useSession();
  return { isAuthenticated, isLoading, user };
}

/**
 * Provider de sesión
 * Envuelve la app para proveer contexto de autenticación
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoadingSession, session], setSession] = useStorageState(STORAGE_KEYS.SESSION_TOKEN);
  const [[isLoadingUser, userJson], setUserJson] = useStorageState(STORAGE_KEYS.USER_DATA);

  // Parsear usuario desde JSON
  const user: User | null = useMemo(() => {
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, [userJson]);

  // Estado de carga inicial
  const isLoading = isLoadingSession || isLoadingUser;

  // Si hay sesión activa
  const isAuthenticated = !!session && !!user;

  // Iniciar sesión
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setSession(response.data.token.token);
    setUserJson(JSON.stringify(response.data.user));
  }, [setSession, setUserJson]);

  // Registrar y autenticar
  const signUp = useCallback(async (credentials: RegisterCredentials) => {
    await authService.register(credentials);
    // Después del registro, hacer login automático
    await signIn({
      email: credentials.email,
      password: credentials.password,
    });
  }, [signIn]);

  // Cerrar sesión
  const signOut = useCallback(() => {
    setSession(null);
    setUserJson(null);
  }, [setSession, setUserJson]);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
    }),
    [session, user, isLoading, isAuthenticated, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
