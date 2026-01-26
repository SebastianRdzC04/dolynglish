// Tipos para lecturas y evaluación
import { StreakEvaluationData } from "./streak";

/**
 * Categorías disponibles para los textos
 */
export type TextCategory =
  | "technology"
  | "science"
  | "history"
  | "education"
  | "programming"
  | "health"
  | "culture";

/**
 * Niveles de dificultad
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Estado del texto (resuelto o pendiente)
 */
export type TextStatus = "pending" | "completed";

/**
 * DTO para texto con información de lectura
 */
export interface Reading {
  id: number;
  title: string;
  description: string;
  content: string;
  category: TextCategory;
  difficulty: DifficultyLevel;
  wordCount: number;
  status: TextStatus;
  score: number | null;
  passed: boolean | null;
  createdAt: string;
}

/**
 * Respuesta de listado de lecturas pendientes
 */
export interface PendingReadingsResponse {
  readings: Reading[];
  pendingCount: number;
  maxPending: number;
  canGenerateMore: boolean;
}

/**
 * Respuesta de listado de lecturas completadas
 */
export interface CompletedReadingsResponse {
  readings: Reading[];
  count: number;
}

/**
 * Resultado de evaluación
 */
export interface EvaluationResult {
  score: number;
  passed: boolean;
  feedback: string;
  reading: Reading;
  streak?: StreakEvaluationData;
}

/**
 * Request para evaluar una lectura
 */
export interface EvaluateRequest {
  userResponse: string;
}

/**
 * Opciones para generar una lectura
 */
export interface GenerateReadingOptions {
  category?: TextCategory;
  size?: "short" | "medium" | "long";
  timePeriod?: string;
  seed?: string;
}

/**
 * Respuesta de generación de lectura
 */
export interface GenerateReadingResponse {
  id: number;
  title: string;
  description: string;
  content: string;
  category: TextCategory;
  difficulty: DifficultyLevel;
  wordCount: number;
  status: TextStatus;
  score: number | null;
  passed: boolean | null;
  createdAt: string;
  seed: string;
  generationParams: {
    category: string;
    subcategories: string[];
    size: string;
    timePeriod?: string;
    contentType: string;
  };
}

/**
 * Mapeo de categorías a español
 */
export const categoryLabels: Record<TextCategory, string> = {
  technology: "Tecnología",
  science: "Ciencia",
  history: "Historia",
  education: "Educación",
  programming: "Programación",
  health: "Salud",
  culture: "Cultura",
};

/**
 * Mapeo de dificultad a español
 */
export const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: "Fácil",
  medium: "Intermedio",
  hard: "Difícil",
};

/**
 * Calcula el tiempo estimado de lectura en minutos
 */
export function getEstimatedTime(wordCount: number): number {
  // Promedio de lectura: ~200 palabras por minuto para aprendices
  return Math.max(1, Math.ceil(wordCount / 150));
}
