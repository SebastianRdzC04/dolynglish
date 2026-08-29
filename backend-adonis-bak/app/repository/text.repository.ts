import { DateTime } from 'luxon'
import Reading from '#models/reading'
import type { CreateTextDto, EvaluationResult, TextStatus } from '../types/api_response.js'

export default class TextRepository {
  /**
   * Create a new reading with all fields.
   */
  async createText(data: CreateTextDto): Promise<Reading> {
    const reading = new Reading()
    reading.userId = data.userId
    reading.title = data.title
    reading.description = data.description
    reading.content = data.content
    reading.category = data.category
    reading.difficulty = data.difficulty
    reading.wordCount = data.wordCount
    reading.status = 'pending'
    reading.score = null
    reading.passed = null
    await reading.save()
    return reading
  }

  /**
   * Get a reading by ID (excluding soft-deleted).
   */
  async getById(id: number): Promise<Reading | null> {
    return Reading.query().where('id', id).whereNull('deleted_at').first()
  }

  /**
   * Get all readings for a user (excluding soft-deleted).
   */
  async getAllByUserId(userId: number): Promise<Reading[]> {
    return Reading.query()
      .where('user_id', userId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
  }

  /**
   * Get readings by user and status.
   */
  async getByUserIdAndStatus(userId: number, status: TextStatus): Promise<Reading[]> {
    return Reading.query()
      .where('user_id', userId)
      .where('status', status)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
  }

  /**
   * Count pending readings for a user.
   */
  async countPendingByUserId(userId: number): Promise<number> {
    const result = await Reading.query()
      .where('user_id', userId)
      .where('status', 'pending')
      .whereNull('deleted_at')
      .count('* as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }

  /**
   * Update the evaluation result on a reading.
   */
  async updateEvaluationResult(
    textId: number,
    evaluation: EvaluationResult
  ): Promise<Reading | null> {
    const reading = await this.getById(textId)
    if (!reading) return null

    reading.score = evaluation.score
    reading.passed = evaluation.passed
    reading.status = 'completed'
    await reading.save()

    return reading
  }

  /**
   * Mark a reading as completed.
   */
  async markAsCompleted(textId: number): Promise<Reading | null> {
    const reading = await this.getById(textId)
    if (!reading) return null

    reading.status = 'completed'
    await reading.save()

    return reading
  }

  /**
   * Soft-delete a reading.
   */
  async softDelete(textId: number): Promise<boolean> {
    const reading = await this.getById(textId)
    if (!reading) return false

    reading.deletedAt = DateTime.now()
    await reading.save()

    return true
  }
}
