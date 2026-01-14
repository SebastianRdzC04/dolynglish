import User from '#models/user'
import { inject } from '@adonisjs/core'
import TextRepository from '../repository/text.repository.js'

@inject()
export default class TextService {
  constructor(private repository: TextRepository) {}

  async saveGeneratedText(userId: User['id'], texto: string) {
    return this.repository.createText(userId, texto)
  }

  async getTextById(id: number) {
    return this.repository.getById(id)
  }

  async getAllTextsByUser(userId: User['id']) {
    return this.repository.getAllByUserId(userId)
  }
}
