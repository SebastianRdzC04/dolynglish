// Hook para obtener y manejar datos de streak
import { useState, useEffect, useCallback } from "react";
import { userService } from "@/services/user.service";
import { StreakResponse, StreakDay } from "@/types/streak";

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
 * Calcula el índice del día actual (Lunes = 0, Domingo = 6)
 */
function getTodayIndex(): number {
  const day = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ...
  return day === 0 ? 6 : day - 1; // Convertir: Lunes = 0, Domingo = 6
}

/**
 * Calcula la fecha del lunes de la semana actual
 */
function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const todayIndex = getTodayIndex();
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIndex);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Formatea una fecha a string YYYY-MM-DD
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convierte el historial del API a un array de 7 booleanos para la semana actual
 * IMPORTANTE: Solo incluye días de la semana actual (desde el lunes)
 * Los días futuros se marcan como false
 */
function getWeekCompletedDays(history: StreakDay[]): boolean[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayIndex = getTodayIndex();
  const monday = getMondayOfCurrentWeek();

  // Crear mapa de fechas completadas del historial
  const completedMap = new Map<string, boolean>(
    history.map((d) => [d.date, d.completed])
  );

  // Generar array de 7 días (Lunes a Domingo)
  const result: boolean[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    day.setHours(0, 0, 0, 0);
    
    const dateStr = formatDateToISO(day);

    // Si el día es futuro (después de hoy), marcarlo como false
    if (day > today) {
      result.push(false);
    } else {
      // Buscar en el historial si ese día está completado
      result.push(completedMap.get(dateStr) ?? false);
    }
  }

  return result;
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
      const data = await userService.getStreak(10);
      setStreak(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar streak");
      console.error("Error fetching streak:", err);
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
