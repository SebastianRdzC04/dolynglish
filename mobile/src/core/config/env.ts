/**
 * Configuración de entorno
 * Centraliza todas las variables de configuración de la aplicación
 */

export const ENV = {
  /**
   * URL base de la API
   * Usa variable de entorno si está disponible, sino usa valor por defecto
   */
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://apidoly.luzna.art',

  /**
   * Tiempo de espera para requests (en ms)
   */
  API_TIMEOUT: 30000,

  /**
   * Modo de desarrollo
   */
  IS_DEV: __DEV__,
} as const;

export type EnvConfig = typeof ENV;
