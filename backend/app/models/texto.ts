import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import User from './user.js'

export default class Texto extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: User['id']

  @column()
  declare texto: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
