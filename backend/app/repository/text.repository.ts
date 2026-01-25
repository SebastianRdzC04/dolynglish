import Texto from '#models/texto'
import type { CreateTextDto, EvaluationResult, TextStatus } from '../types/api_response.js'

export default class TextRepository {
  /**
   * Crea un nuevo texto con todos los campos
   */
  async createText(data: CreateTextDto): Promise<Texto> {
    const text = new Texto()
    text.userId = data.userId
    text.title = data.title
    text.description = data.description
    text.content = data.content
    text.category = data.category
    text.difficulty = data.difficulty
    text.wordCount = data.wordCount
    text.status = 'pending'
    text.score = null
    text.passed = null
    await text.save()
    return text
  }

  /**
   * Obtiene un texto por ID (excluyendo eliminados)
   */
  async getById(id: number): Promise<Texto | null> {
    return Texto.query().where('id', id).whereNull('deleted_at').first()
  }

  /**
   * Obtiene todos los textos de un usuario (excluyendo eliminados)
   */
  async getAllByUserId(userId: number): Promise<Texto[]> {
    return Texto.query()
      .where('user_id', userId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
  }

  /**
   * Obtiene textos por usuario y estado
   */
  async getByUserIdAndStatus(userId: number, status: TextStatus): Promise<Texto[]> {
    return Texto.query()
      .where('user_id', userId)
      .where('status', status)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
  }

  /**
   * Cuenta textos pendientes de un usuario
   */
  async countPendingByUserId(userId: number): Promise<number> {
    const result = await Texto.query()
      .where('user_id', userId)
      .where('status', 'pending')
      .whereNull('deleted_at')
      .count('* as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }

  /**
   * Actualiza el resultado de evaluación de un texto
   */
  async updateEvaluationResult(
    textId: number,
    evaluation: EvaluationResult
  ): Promise<Texto | null> {
    const text = await this.getById(textId)
    if (!text) return null

    text.score = evaluation.score
    text.passed = evaluation.passed
    text.status = 'completed'
    await text.save()

    return text
  }

  /**
   * Marca un texto como completado
   */
  async markAsCompleted(textId: number): Promise<Texto | null> {
    const text = await this.getById(textId)
    if (!text) return null

    text.status = 'completed'
    await text.save()

    return text
  }

  /**
   * Soft delete de un texto
   */
  async softDelete(textId: number): Promise<boolean> {
    const text = await this.getById(textId)
    if (!text) return false

    text.deletedAt = text.deletedAt ?? (await import('luxon')).DateTime.now()
    await text.save()

    return true
  }
}
