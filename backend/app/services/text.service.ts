import Reading from '#models/reading'
import { inject } from '@adonisjs/core'
import TextRepository from '../repository/text.repository.js'
import type {
  CreateTextDto,
  EvaluationResult,
  GeneratedTextResponse,
  PendingReadingsResponse,
  ReadingDto,
  TextStatus,
} from '../types/api_response.js'

/**
 * Maximum number of pending readings allowed per user.
 */
const MAX_PENDING_TEXTS = 3

@inject()
export default class TextService {
  constructor(private repository: TextRepository) {}

  /**
   * Save an AI-generated text with all its metadata.
   */
  async saveGeneratedText(userId: number, generatedData: GeneratedTextResponse): Promise<Reading> {
    const wordCount = this.countWords(generatedData.content)

    const createDto: CreateTextDto = {
      userId,
      title: generatedData.title,
      description: generatedData.description,
      content: generatedData.content,
      category: generatedData.category,
      difficulty: generatedData.difficulty,
      wordCount,
    }

    return this.repository.createText(createDto)
  }

  /**
   * Get a reading by ID.
   */
  async getTextById(id: number): Promise<Reading | null> {
    return this.repository.getById(id)
  }

  /**
   * Get all readings for a user.
   */
  async getAllTextsByUser(userId: number): Promise<Reading[]> {
    return this.repository.getAllByUserId(userId)
  }

  /**
   * Get pending readings for a user.
   */
  async getPendingReadings(userId: number): Promise<PendingReadingsResponse> {
    const pendingTexts = await this.repository.getByUserIdAndStatus(userId, 'pending')
    const pendingCount = pendingTexts.length

    const readings: ReadingDto[] = pendingTexts.map((text) => text.toReadingDto())

    return {
      readings,
      pendingCount,
      maxPending: MAX_PENDING_TEXTS,
      canGenerateMore: pendingCount < MAX_PENDING_TEXTS,
    }
  }

  /**
   * Get readings by status.
   */
  async getReadingsByStatus(userId: number, status: TextStatus): Promise<ReadingDto[]> {
    const texts = await this.repository.getByUserIdAndStatus(userId, status)
    return texts.map((text) => text.toReadingDto())
  }

  /**
   * Check if the user can generate more readings.
   */
  async canUserGenerateMore(userId: number): Promise<boolean> {
    const pendingCount = await this.repository.countPendingByUserId(userId)
    return pendingCount < MAX_PENDING_TEXTS
  }

  /**
   * Get the count of pending readings.
   */
  async getPendingCount(userId: number): Promise<number> {
    return this.repository.countPendingByUserId(userId)
  }

  /**
   * Save a comprehension evaluation result.
   */
  async saveEvaluationResult(
    textId: number,
    evaluation: EvaluationResult
  ): Promise<Reading | null> {
    return this.repository.updateEvaluationResult(textId, evaluation)
  }

  /**
   * Count words in a text.
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  /**
   * Get the maximum number of pending readings allowed.
   */
  getMaxPendingTexts(): number {
    return MAX_PENDING_TEXTS
  }

  /**
   * Soft-delete a pending reading.
   * Only allows deleting readings that are pending and belong to the user.
   */
  async deleteReading(userId: number, textId: number): Promise<boolean> {
    const text = await this.repository.getById(textId)

    if (!text || text.userId !== userId || text.status !== 'pending') {
      return false
    }

    return this.repository.softDelete(textId)
  }
}
