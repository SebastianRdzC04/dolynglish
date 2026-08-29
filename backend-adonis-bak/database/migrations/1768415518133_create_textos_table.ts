import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'textos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('title', 255).notNullable()
      table.text('description').notNullable()
      table.text('content').notNullable()
      table.string('category', 50).notNullable().defaultTo('technology')
      table.string('difficulty', 20).notNullable().defaultTo('medium')
      table.integer('word_count').notNullable().defaultTo(0)
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('score').nullable()
      table.boolean('passed').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      // Índices
      table.index(['user_id'])
      table.index(['status'])
      table.index(['user_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
