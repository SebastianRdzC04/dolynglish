/**
 * Hook para manejar estado persistente en almacenamiento seguro
 * Sincroniza estado de React con SecureStore/localStorage
 */

import { useEffect, useCallback, useReducer } from "react";
import { secureStorage } from "@/src/core/storage";

/**
 * Tipo de retorno del hook
 * [isLoading, value], setValue
 */
type UseStorageStateReturn<T> = [
  [boolean, T | null],
  (value: T | null) => Promise<void>,
];

/**
 * Reducer para manejar estado async
 */
function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStorageStateReturn<T> {
  return useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null,
    ): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStorageStateReturn<T>;
}

/**
 * Hook para persistir estado en almacenamiento seguro
 * @param key - Clave de almacenamiento
 * @returns Tuple con [isLoading, value] y función setValue
 *
 * @example
 * const [[isLoading, token], setToken] = useStorageState('session');
 */
export function useStorageState(key: string): UseStorageStateReturn<string> {
  const [state, setState] = useAsyncState<string>();

  // Cargar valor inicial desde storage
  useEffect(() => {
    secureStorage.getItem(key).then((value) => {
      setState(value);
    });
  }, [key]);

  // Función para actualizar valor
  // Persiste en storage ANTES de actualizar React state para evitar race conditions
  // (e.g. apiClient.getAuthToken() leyendo storage antes de que el token se persista)
  const setValue = useCallback(
    async (value: string | null) => {
      if (value === null) {
        await secureStorage.deleteItem(key);
      } else {
        await secureStorage.setItem(key, value);
      }
      setState(value);
    },
    [key],
  );

  return [state, setValue];
}
