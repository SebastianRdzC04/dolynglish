import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { UserProfileResponse } from '../types/streak.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare currentStreak: number

  @column.date()
  declare lastStreakDate: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  /**
   * Serializa el usuario para respuesta de perfil (sin datos sensibles)
   */
  toProfileDto(): UserProfileResponse {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      currentStreak: this.currentStreak ?? 0,
      lastStreakDate: this.lastStreakDate?.toISODate() ?? null,
      createdAt: this.createdAt?.toISO() ?? new Date().toISOString(),
    }
  }
}
