/**
 * Utilidades para lecturas
 */

import { APP_CONFIG } from '@/src/core/config';
import { TextCategory, DifficultyLevel } from '../types';

/**
 * Mapeo de categorías a español
 */
export const categoryLabels: Record<TextCategory, string> = {
  technology: 'Tecnología',
  history: 'Historia',
  education: 'Educación',
  programming: 'Programación',
  culture: 'Cultura',
  pop_culture: 'Cultura Pop',
};

/**
 * Mapeo de dificultad a español
 */
export const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Difícil',
};

/**
 * Configuración de colores por dificultad
 */
export const difficultyConfig: Record<
  DifficultyLevel,
  { label: string; color: string; bgColor: string }
> = {
  easy: {
    label: 'Fácil',
    color: '#2ecc71',
    bgColor: 'rgba(46, 204, 113, 0.15)',
  },
  medium: {
    label: 'Intermedio',
    color: '#f4a261',
    bgColor: 'rgba(244, 162, 97, 0.15)',
  },
  hard: {
    label: 'Difícil',
    color: '#e74c3c',
    bgColor: 'rgba(231, 76, 60, 0.15)',
  },
};

/**
 * Calcula el tiempo estimado de lectura en minutos
 */
export function getEstimatedTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / APP_CONFIG.WORDS_PER_MINUTE));
}

/**
 * Obtiene la etiqueta de categoría en español
 * Para categorías no reconocidas, devuelve un fallback genérico elegante
 */
export function getCategoryLabel(category: string): string {
  return categoryLabels[category as TextCategory] || 'Conocimiento General';
}

/**
 * Obtiene la etiqueta de dificultad en español
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  return difficultyLabels[difficulty] || difficulty;
}

/**
 * Verifica si una puntuación es aprobatoria
 */
export function isPassing(score: number): boolean {
  return score >= APP_CONFIG.PASSING_SCORE;
}

/**
 * Formatea el conteo de palabras
 */
export function formatWordCount(count: number): string {
  return `${count.toLocaleString()} palabras`;
}

/**
 * Formatea el tiempo estimado de lectura
 */
export function formatEstimatedTime(wordCount: number): string {
  const time = getEstimatedTime(wordCount);
  return `${time} min`;
}

/**
 * Tipo para tamaño de texto
 */
export type TextSize = 'short' | 'medium' | 'long';

/**
 * Mapeo de tamaños a español con descripción
 */
export const sizeLabels: Record<TextSize, string> = {
  short: 'Corto',
  medium: 'Medio',
  long: 'Largo',
};

/**
 * Configuración de tamaños con tiempo estimado
 */
export const sizeConfig: Record<
  TextSize,
  { label: string; description: string; time: string }
> = {
  short: {
    label: 'Corto',
    description: '80-120 palabras',
    time: '~1 min',
  },
  medium: {
    label: 'Medio',
    description: '150-220 palabras',
    time: '~2 min',
  },
  long: {
    label: 'Largo',
    description: '250-350 palabras',
    time: '~3 min',
  },
};
