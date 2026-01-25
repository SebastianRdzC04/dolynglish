import { inject } from '@adonisjs/core'
import PromptLogRepository from '../repository/prompt_log.repository.js'
import type {
  PromptLogDto,
  PromptLogFilters,
  PromptLogStats,
} from '../types/prompt_log.js'
import type { RandomPromptParams, GeneratedPrompt, GenerateTextOptions } from '../types/prompt_generator.js'

@inject()
export default class PromptLogService {
  constructor(private repository: PromptLogRepository) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE LOGGING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log cuando se genera un prompt exitosamente
   */
  async logPromptGenerated(
    params: RandomPromptParams,
    prompt: GeneratedPrompt,
    userId?: number,
    durationMs?: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'info',
        event: 'prompt_generated',
        message: 'Prompt generated successfully for reading text',
        seed: prompt.seed,
        userId,
        params: this.serializeParams(params),
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        durationMs,
      })
    } catch (error) {
      // No lanzar error si falla el logging, solo logear en consola
      console.error('Failed to log prompt generation:', error)
    }
  }

  /**
   * Log cuando falla la generación de prompt
   */
  async logPromptGenerationFailed(
    error: Error,
    options?: GenerateTextOptions,
    userId?: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'error',
        event: 'prompt_generation_failed',
        message: 'Failed to generate prompt',
        userId,
        params: options ? { options } : undefined,
        errorMessage: error.message,
        errorStack: error.stack,
      })
    } catch (logError) {
      console.error('Failed to log prompt generation error:', logError)
    }
  }

  /**
   * Log cuando se guarda un texto exitosamente
   */
  async logTextSaved(
    textId: number,
    seed: string,
    userId: number,
    durationMs?: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'info',
        event: 'text_saved',
        message: 'Reading text saved successfully',
        seed,
        userId,
        textId,
        durationMs,
      })
    } catch (error) {
      console.error('Failed to log text save:', error)
    }
  }

  /**
   * Log cuando falla guardar el texto
   */
  async logTextSaveFailed(
    error: Error,
    seed: string,
    userId: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'error',
        event: 'text_save_failed',
        message: 'Failed to save reading text',
        seed,
        userId,
        errorMessage: error.message,
        errorStack: error.stack,
      })
    } catch (logError) {
      console.error('Failed to log text save error:', logError)
    }
  }

  /**
   * Log cuando se completa una evaluación
   */
  async logEvaluationCompleted(
    textId: number,
    userId: number,
    score: number,
    passed: boolean,
    durationMs?: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'info',
        event: 'evaluation_completed',
        message: `Evaluation completed: score=${score}, passed=${passed}`,
        userId,
        textId,
        params: { score, passed },
        durationMs,
      })
    } catch (error) {
      console.error('Failed to log evaluation:', error)
    }
  }

  /**
   * Log cuando falla la evaluación
   */
  async logEvaluationFailed(
    error: Error,
    textId: number,
    userId: number
  ): Promise<void> {
    try {
      await this.repository.create({
        level: 'error',
        event: 'evaluation_failed',
        message: 'Failed to evaluate reading comprehension',
        userId,
        textId,
        errorMessage: error.message,
        errorStack: error.stack,
      })
    } catch (logError) {
      console.error('Failed to log evaluation error:', logError)
    }
  }

  /**
   * Log cuando se parsea un seed exitosamente
   */
  async logSeedParsed(seed: string, userId?: number): Promise<void> {
    try {
      await this.repository.create({
        level: 'debug',
        event: 'seed_parsed',
        message: 'Seed parsed successfully',
        seed,
        userId,
      })
    } catch (error) {
      console.error('Failed to log seed parse:', error)
    }
  }

  /**
   * Log cuando falla el parsing de un seed
   */
  async logSeedParseFailed(seed: string, error: Error, userId?: number): Promise<void> {
    try {
      await this.repository.create({
        level: 'warn',
        event: 'seed_parse_failed',
        message: 'Failed to parse seed, generating random prompt instead',
        seed,
        userId,
        errorMessage: error.message,
      })
    } catch (logError) {
      console.error('Failed to log seed parse error:', logError)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE CONSULTA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Buscar logs con filtros
   */
  async findLogs(filters: PromptLogFilters): Promise<PromptLogDto[]> {
    const logs = await this.repository.findWithFilters(filters)
    return logs.map((log) => log.toDto())
  }

  /**
   * Buscar por seed específico
   */
  async findBySeed(seed: string): Promise<PromptLogDto | null> {
    const log = await this.repository.findBySeed(seed)
    return log ? log.toDto() : null
  }

  /**
   * Obtener estadísticas de generación
   */
  async getGenerationStats(fromDate?: string, toDate?: string): Promise<PromptLogStats> {
    return this.repository.getStats(fromDate, toDate)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANTENIMIENTO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Limpiar logs antiguos
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    return this.repository.deleteOlderThan(retentionDays)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES PRIVADAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Serializa los parámetros para guardar en JSON
   */
  private serializeParams(params: RandomPromptParams): Record<string, unknown> {
    return {
      primaryCategory: params.primaryCategory,
      secondaryCategory: params.secondaryCategory,
      subcategories: params.subcategories,
      timePeriod: params.timePeriod
        ? {
            id: params.timePeriod.id,
            name: params.timePeriod.name,
          }
        : null,
      specificYear: params.specificYear,
      textSize: {
        label: params.textSize.label,
        min: params.textSize.min,
        max: params.textSize.max,
      },
      contentType: params.contentType,
      perspective: params.perspective,
      geographicContext: params.geographicContext,
      uniqueFocusElement: params.uniqueFocusElement,
    }
  }
}
