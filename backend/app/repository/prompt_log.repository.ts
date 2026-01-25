import PromptLog from '#models/prompt_log'
import type { CreatePromptLogDto, PromptLogFilters, PromptLogStats } from '../types/prompt_log.js'

export default class PromptLogRepository {
  /**
   * Crea un nuevo log
   */
  async create(data: CreatePromptLogDto): Promise<PromptLog> {
    const log = new PromptLog()
    log.level = data.level
    log.event = data.event
    log.message = data.message
    log.seed = data.seed ?? null
    log.userId = data.userId ?? null
    log.textId = data.textId ?? null
    log.params = data.params ? (data.params as Record<string, unknown>) : null
    log.systemPrompt = data.systemPrompt ?? null
    log.userPrompt = data.userPrompt ?? null
    log.errorMessage = data.errorMessage ?? null
    log.errorStack = data.errorStack ?? null
    log.durationMs = data.durationMs ?? null
    await log.save()
    return log
  }

  /**
   * Buscar logs con filtros
   */
  async findWithFilters(filters: PromptLogFilters): Promise<PromptLog[]> {
    const query = PromptLog.query().orderBy('created_at', 'desc')

    if (filters.level) {
      query.where('level', filters.level)
    }

    if (filters.event) {
      query.where('event', filters.event)
    }

    if (filters.userId) {
      query.where('user_id', filters.userId)
    }

    if (filters.seed) {
      query.where('seed', filters.seed)
    }

    if (filters.fromDate) {
      query.where('created_at', '>=', filters.fromDate)
    }

    if (filters.toDate) {
      query.where('created_at', '<=', filters.toDate)
    }

    if (filters.offset) {
      query.offset(filters.offset)
    }

    query.limit(filters.limit ?? 100)

    return query
  }

  /**
   * Buscar por seed
   */
  async findBySeed(seed: string): Promise<PromptLog | null> {
    return PromptLog.query().where('seed', seed).first()
  }

  /**
   * Obtener logs de un usuario
   */
  async findByUserId(userId: number, limit: number = 50): Promise<PromptLog[]> {
    return PromptLog.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Obtener estadísticas de generación
   */
  async getStats(fromDate?: string, toDate?: string): Promise<PromptLogStats> {
    let baseQuery = PromptLog.query().where('event', 'prompt_generated')

    if (fromDate) {
      baseQuery = baseQuery.where('created_at', '>=', fromDate)
    }

    if (toDate) {
      baseQuery = baseQuery.where('created_at', '<=', toDate)
    }

    // Total de prompts generados
    const totalResult = await baseQuery.clone().count('* as total').first()
    const totalPrompts = Number(totalResult?.$extras.total ?? 0)

    // Promedio de duración
    const avgResult = await baseQuery.clone().avg('duration_ms as avg').first()
    const avgDurationMs = Number(avgResult?.$extras.avg ?? 0)

    // Tasa de errores
    let errorQuery = PromptLog.query().where('level', 'error')
    if (fromDate) errorQuery = errorQuery.where('created_at', '>=', fromDate)
    if (toDate) errorQuery = errorQuery.where('created_at', '<=', toDate)
    const errorResult = await errorQuery.count('* as total').first()
    const errorCount = Number(errorResult?.$extras.total ?? 0)

    let totalQuery = PromptLog.query()
    if (fromDate) totalQuery = totalQuery.where('created_at', '>=', fromDate)
    if (toDate) totalQuery = totalQuery.where('created_at', '<=', toDate)
    const allResult = await totalQuery.count('* as total').first()
    const allCount = Number(allResult?.$extras.total ?? 0)

    const errorRate = allCount > 0 ? (errorCount / allCount) * 100 : 0

    // Por categoría y tamaño (requiere parsing de JSON, se hace en memoria)
    const logs = await baseQuery.clone().select('params').limit(10000)
    const byCategory: Record<string, number> = {}
    const bySize: Record<string, number> = {}

    for (const log of logs) {
      if (log.params) {
        const category = (log.params as Record<string, unknown>).primaryCategory as string
        const size = ((log.params as Record<string, unknown>).textSize as Record<string, unknown>)
          ?.label as string

        if (category) {
          byCategory[category] = (byCategory[category] ?? 0) + 1
        }
        if (size) {
          bySize[size] = (bySize[size] ?? 0) + 1
        }
      }
    }

    return {
      totalPrompts,
      byCategory,
      bySize,
      avgDurationMs: Math.round(avgDurationMs),
      errorRate: Math.round(errorRate * 100) / 100,
    }
  }

  /**
   * Limpiar logs antiguos
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await PromptLog.query()
      .where('created_at', '<', cutoffDate.toISOString())
      .delete()

    return Array.isArray(result) ? result.length : result
  }
}
