// Tipos para el sistema de rachas (streaks)

/**
 * Representa un día en el historial de racha
 */
export interface StreakDay {
  /** Fecha en formato ISO (YYYY-MM-DD) */
  date: string;
  /** Si el usuario completó al menos un texto exitosamente ese día */
  completed: boolean;
  /** Cantidad de textos completados exitosamente ese día */
  textsCompleted: number;
}

/**
 * Respuesta del endpoint de streak
 */
export interface StreakResponse {
  /** Días consecutivos de racha actual */
  currentStreak: number;
  /** Si el usuario ya completó al menos un texto hoy */
  todayCompleted: boolean;
  /** Última fecha de actividad exitosa (ISO string) o null si nunca */
  lastActivityDate: string | null;
  /** Historial de los últimos N días */
  history: StreakDay[];
}

/**
 * Datos de streak para incluir en respuesta de evaluación
 */
export interface StreakEvaluationData {
  currentStreak: number;
  streakExtended: boolean;
  todayCompleted: boolean;
}

/**
 * Perfil de usuario para respuesta de API
 */
export interface UserProfile {
  id: number;
  fullName: string | null;
  email: string;
  currentStreak: number;
  lastStreakDate: string | null;
  createdAt: string;
}

/**
 * Respuesta combinada de /user/me
 */
export interface UserMeResponse {
  profile: UserProfile;
  streak: StreakResponse;
}
