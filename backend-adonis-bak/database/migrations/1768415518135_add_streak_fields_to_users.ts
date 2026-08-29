import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Días consecutivos de racha actual
      table.integer('current_streak').notNullable().defaultTo(0)
      // Última fecha que contribuyó a la racha (DATE, no TIMESTAMP)
      table.date('last_streak_date').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('current_streak')
      table.dropColumn('last_streak_date')
    })
  }
}
