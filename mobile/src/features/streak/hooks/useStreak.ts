/**
 * Hook para obtener y manejar datos de streak
 */

import { useState, useEffect, useCallback } from 'react';
import { streakService } from '../services';
import { StreakResponse } from '../types';
import { getTodayIndex, getWeekCompletedDays } from '../utils';

interface UseStreakReturn {
  /** Datos de streak del API */
  streak: StreakResponse | null;
  /** Días completados de la semana actual [L, M, X, J, V, S, D] */
  weekCompletedDays: boolean[];
  /** Índice del día actual (0 = Lunes, 6 = Domingo) */
  todayIndex: number;
  /** Si está cargando */
  isLoading: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Refrescar datos */
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener datos de streak con lógica de semana actual
 */
export function useStreak(): UseStreakReturn {
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayIndex = getTodayIndex();

  const fetchStreak = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Pedir 10 días para asegurar que tenemos toda la semana actual
      const data = await streakService.getStreak(10);
      setStreak(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar streak');
      console.error('Error fetching streak:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Calcular días completados de la semana actual
  const weekCompletedDays = streak?.history
    ? getWeekCompletedDays(streak.history)
    : [false, false, false, false, false, false, false];

  return {
    streak,
    weekCompletedDays,
    todayIndex,
    isLoading,
    error,
    refetch: fetchStreak,
  };
}
