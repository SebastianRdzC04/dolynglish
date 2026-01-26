/**
 * Constantes globales de la aplicación
 */

/**
 * Claves de almacenamiento seguro
 */
export const STORAGE_KEYS = {
  SESSION_TOKEN: 'session',
  USER_DATA: 'user',
} as const;

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  /**
   * Máximo de lecturas pendientes permitidas
   */
  MAX_PENDING_READINGS: 3,

  /**
   * Palabras por minuto promedio para calcular tiempo de lectura
   */
  WORDS_PER_MINUTE: 150,

  /**
   * Puntuación mínima para aprobar una evaluación
   */
  PASSING_SCORE: 80,

  /**
   * Longitud mínima de respuesta en evaluación
   */
  MIN_RESPONSE_LENGTH: 20,
} as const;

/**
 * Días de la semana en español (abreviados)
 */
export const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
