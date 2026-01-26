/**
 * Utilidades para cálculos de fechas y streak
 */

import { WEEK_DAYS } from '@/src/core/config';
import { StreakDay } from '../types';

/**
 * Obtiene el índice del día actual en la semana (Lunes = 0, Domingo = 6)
 */
export function getTodayIndex(): number {
  const day = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ...
  return day === 0 ? 6 : day - 1; // Convertir: Lunes = 0, Domingo = 6
}

/**
 * Obtiene la fecha del lunes de la semana actual
 */
export function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const todayIndex = getTodayIndex();
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIndex);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Formatea una fecha a string ISO (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte el historial del API a un array de 7 booleanos para la semana actual
 * Solo incluye días de la semana actual (desde el lunes)
 * Los días futuros se marcan como false
 */
export function getWeekCompletedDays(history: StreakDay[]): boolean[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
 * Obtiene la etiqueta del día de la semana
 */
export function getDayLabel(index: number): string {
  return WEEK_DAYS[index] || '';
}

/**
 * Calcula cuántos días faltan para completar la semana
 */
export function getRemainingDaysInWeek(): number {
  return 6 - getTodayIndex();
}

/**
 * Verifica si hoy es el primer día de la semana (lunes)
 */
export function isStartOfWeek(): boolean {
  return getTodayIndex() === 0;
}

/**
 * Verifica si hoy es el último día de la semana (domingo)
 */
export function isEndOfWeek(): boolean {
  return getTodayIndex() === 6;
}
