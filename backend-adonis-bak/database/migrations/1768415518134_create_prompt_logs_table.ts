import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'prompt_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('level', 20).notNullable()
      table.string('event', 100).notNullable()
      table.text('message').notNullable()
      table.string('seed', 255).nullable()
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table
        .integer('text_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('textos')
        .onDelete('SET NULL')
      table.jsonb('params').nullable()
      table.text('system_prompt').nullable()
      table.text('user_prompt').nullable()
      table.text('error_message').nullable()
      table.text('error_stack').nullable()
      table.integer('duration_ms').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Índices para búsquedas frecuentes
      table.index(['level'])
      table.index(['event'])
      table.index(['seed'])
      table.index(['user_id'])
      table.index(['created_at'])
      table.index(['user_id', 'created_at'])
      table.index(['event', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
