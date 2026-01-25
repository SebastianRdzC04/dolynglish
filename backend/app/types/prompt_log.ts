import type { RandomPromptParams } from './prompt_generator.js'

/**
 * Niveles de log disponibles
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Tipos de eventos de log
 */
export type LogEvent =
  | 'prompt_generated'
  | 'prompt_generation_failed'
  | 'text_saved'
  | 'text_save_failed'
  | 'evaluation_completed'
  | 'evaluation_failed'
  | 'seed_parsed'
  | 'seed_parse_failed'

/**
 * DTO para crear un log
 */
export interface CreatePromptLogDto {
  level: LogLevel
  event: LogEvent
  message: string
  seed?: string
  userId?: number
  textId?: number
  params?: RandomPromptParams | Record<string, unknown>
  systemPrompt?: string
  userPrompt?: string
  errorMessage?: string
  errorStack?: string
  durationMs?: number
}

/**
 * DTO para respuesta de log
 */
export interface PromptLogDto {
  id: number
  level: LogLevel
  event: LogEvent
  message: string
  seed: string | null
  userId: number | null
  textId: number | null
  params: Record<string, unknown> | null
  systemPrompt: string | null
  userPrompt: string | null
  errorMessage: string | null
  durationMs: number | null
  createdAt: string
}

/**
 * Filtros para buscar logs
 */
export interface PromptLogFilters {
  level?: LogLevel
  event?: LogEvent
  userId?: number
  seed?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

/**
 * Estadísticas de generación de prompts
 */
export interface PromptLogStats {
  totalPrompts: number
  byCategory: Record<string, number>
  bySize: Record<string, number>
  avgDurationMs: number
  errorRate: number
}
