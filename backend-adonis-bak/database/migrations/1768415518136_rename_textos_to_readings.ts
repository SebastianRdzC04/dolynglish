import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.renameTable('textos', 'readings')
  }

  async down() {
    this.schema.renameTable('readings', 'textos')
  }
}
