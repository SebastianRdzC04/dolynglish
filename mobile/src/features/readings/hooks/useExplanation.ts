/**
 * Hook para manejar explicaciones de texto seleccionado
 * Con soporte de caché local para reducir llamadas API
 */

import { useState, useCallback } from 'react';
import { readingsService } from '../services';
import { ExplanationResponse } from '../types';
import { 
  getCachedExplanation, 
  cacheExplanation 
} from '../utils/explanationCache';

interface UseExplanationReturn {
  /** Explicación actual */
  explanation: ExplanationResponse | null;
  /** Si está cargando */
  isLoading: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Información de rate limit */
  rateLimitInfo: { usedToday: number; limit: number } | null;
  /** Si la explicación viene del caché */
  fromCache: boolean;
  /** Solicitar explicación */
  requestExplanation: (selection: string) => Promise<void>;
  /** Limpiar explicación */
  clear: () => void;
}

/**
 * Hook para obtener explicaciones de texto seleccionado
 * Primero intenta obtener del caché local, luego hace request a API
 */
export function useExplanation(readingId: number): UseExplanationReturn {
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ usedToday: number; limit: number } | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const requestExplanation = useCallback(
    async (selection: string) => {
      const trimmed = selection.trim();
      
      if (!trimmed) {
        setError('Please select some text first');
        return;
      }

      if (trimmed.length > 200) {
        setError('Selection is too long. Please select a shorter phrase or sentence.');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setFromCache(false);

        // 1. Intentar obtener del caché primero
        const cached = await getCachedExplanation(readingId, trimmed);
        
        if (cached) {
          console.log('✅ Explanation loaded from cache');
          setExplanation(cached);
          setFromCache(true);
          setIsLoading(false);
          return;
        }

        // 2. Si no hay caché, hacer request a API
        const result = await readingsService.explain(readingId, {
          selection: trimmed,
          type: 'sentence',
        });

        setExplanation(result);
        setFromCache(false);

        // 3. Guardar en caché para futuras consultas
        await cacheExplanation(readingId, trimmed, result);
        console.log('💾 Explanation cached successfully');

      } catch (err: any) {
        // Handle rate limit specifically
        if (err.response?.status === 429) {
          const data = err.response?.data?.data;
          if (data) {
            setRateLimitInfo({ usedToday: data.usedToday, limit: data.limit });
          }
          setError(err.response?.data?.message || 'You have reached the daily explanation limit. Try again tomorrow.');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get explanation';
          setError(errorMessage);
        }
        console.error('Error requesting explanation:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [readingId]
  );

  const clear = useCallback(() => {
    setExplanation(null);
    setError(null);
    setRateLimitInfo(null);
    setFromCache(false);
  }, []);

  return {
    explanation,
    isLoading,
    error,
    rateLimitInfo,
    fromCache,
    requestExplanation,
    clear,
  };
}
