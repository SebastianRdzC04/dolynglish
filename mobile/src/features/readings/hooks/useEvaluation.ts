/**
 * Hook para manejar la evaluación de una lectura
 */

import { useState, useCallback } from 'react';
import { readingsService } from '../services';
import { EvaluationResult } from '../types';
import { APP_CONFIG } from '@/src/core/config';

interface UseEvaluationReturn {
  /** Resultado de la evaluación */
  result: EvaluationResult | null;
  /** Si está enviando la evaluación */
  isSubmitting: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Enviar respuesta para evaluación */
  submit: (userResponse: string) => Promise<EvaluationResult | null>;
  /** Limpiar error */
  clearError: () => void;
  /** Reiniciar estado */
  reset: () => void;
}

/**
 * Hook para manejar la evaluación de una lectura
 */
export function useEvaluation(readingId: number): UseEvaluationReturn {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (userResponse: string): Promise<EvaluationResult | null> => {
      // Validar respuesta
      const trimmedResponse = userResponse.trim();
      
      if (!trimmedResponse) {
        setError('Por favor, escribe tu respuesta antes de enviar');
        return null;
      }

      if (trimmedResponse.length < APP_CONFIG.MIN_RESPONSE_LENGTH) {
        setError('Tu respuesta es muy corta. Intenta explicar más lo que entendiste');
        return null;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const evaluation = await readingsService.evaluate(readingId, {
          userResponse: trimmedResponse,
        });

        setResult(evaluation);
        return evaluation;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al evaluar la respuesta');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [readingId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return {
    result,
    isSubmitting,
    error,
    submit,
    clearError,
    reset,
  };
}
