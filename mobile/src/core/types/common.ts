/**
 * Tipos comunes compartidos en toda la aplicación
 */

/**
 * Estado base para hooks de datos
 */
export interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Resultado de operación asíncrona
 */
export type AsyncResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * Función de callback sin parámetros
 */
export type VoidCallback = () => void;

/**
 * Función de callback async sin parámetros
 */
export type AsyncVoidCallback = () => Promise<void>;
