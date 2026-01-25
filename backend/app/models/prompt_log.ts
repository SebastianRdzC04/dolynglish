import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Texto from './texto.js'
import type { LogLevel, LogEvent } from '../types/prompt_log.js'

export default class PromptLog extends BaseModel {
  static table = 'prompt_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare level: LogLevel

  @column()
  declare event: LogEvent

  @column()
  declare message: string

  @column()
  declare seed: string | null

  @column()
  declare userId: number | null

  @column()
  declare textId: number | null

  @column({
    prepare: (value: Record<string, unknown> | null) => JSON.stringify(value),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare params: Record<string, unknown> | null

  @column()
  declare systemPrompt: string | null

  @column()
  declare userPrompt: string | null

  @column()
  declare errorMessage: string | null

  @column()
  declare errorStack: string | null

  @column()
  declare durationMs: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Texto)
  declare texto: BelongsTo<typeof Texto>

  /**
   * Serializa el modelo para respuesta de API
   */
  toDto() {
    return {
      id: this.id,
      level: this.level,
      event: this.event,
      message: this.message,
      seed: this.seed,
      userId: this.userId,
      textId: this.textId,
      params: this.params,
      systemPrompt: this.systemPrompt,
      userPrompt: this.userPrompt,
      errorMessage: this.errorMessage,
      durationMs: this.durationMs,
      createdAt: this.createdAt?.toISO() ?? new Date().toISOString(),
    }
  }
}
