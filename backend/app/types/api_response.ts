/**
 * Estructura estándar de respuesta de la API
 */
export interface ApiResponse<T = unknown> {
  message: string
  data: T
}

/**
 * Respuesta de error de la API
 */
export interface ApiErrorResponse {
  message: string
  error?: string
}

/**
 * Categorías disponibles para los textos
 */
export type TextCategory =
  | 'technology'
  | 'science'
  | 'history'
  | 'education'
  | 'programming'
  | 'health'
  | 'culture'
  | 'pop_culture'

/**
 * Niveles de dificultad
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/**
 * Estado del texto (resuelto o pendiente)
 */
export type TextStatus = 'pending' | 'completed'

/**
 * DTO para crear un texto generado
 */
export interface CreateTextDto {
  userId: number
  title: string
  description: string
  content: string
  category: TextCategory
  difficulty: DifficultyLevel
  wordCount: number
}

/**
 * DTO para la respuesta de texto generado por IA
 */
export interface GeneratedTextResponse {
  title: string
  description: string
  content: string
  category: TextCategory
  difficulty: DifficultyLevel
}

/**
 * DTO para la respuesta de evaluación
 */
export interface EvaluationResult {
  score: number
  passed: boolean
  feedback?: string
}

/**
 * DTO para texto con información de lectura
 */
export interface ReadingDto {
  id: number
  title: string
  description: string
  content: string
  category: TextCategory
  difficulty: DifficultyLevel
  wordCount: number
  status: TextStatus
  score: number | null
  passed: boolean | null
  createdAt: string
}

/**
 * DTO para listado de lecturas pendientes
 */
export interface PendingReadingsResponse {
  readings: ReadingDto[]
  pendingCount: number
  maxPending: number
  canGenerateMore: boolean
}
