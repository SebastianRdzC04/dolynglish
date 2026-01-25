import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import type { DifficultyLevel, TextCategory, TextStatus } from '../types/api_response.js'

export default class Texto extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare content: string

  @column()
  declare category: TextCategory

  @column()
  declare difficulty: DifficultyLevel

  @column()
  declare wordCount: number

  @column()
  declare status: TextStatus

  @column()
  declare score: number | null

  @column()
  declare passed: boolean | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Serializa el modelo para la respuesta de API
   */
  toReadingDto() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      content: this.content,
      category: this.category,
      difficulty: this.difficulty,
      wordCount: this.wordCount,
      status: this.status,
      score: this.score,
      passed: this.passed,
      createdAt: this.createdAt?.toISO() ?? new Date().toISOString(),
    }
  }
}
