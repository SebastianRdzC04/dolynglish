import Texto from '#models/texto'
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
 * Número máximo de textos pendientes permitidos por usuario
 */
const MAX_PENDING_TEXTS = 3

@inject()
export default class TextService {
  constructor(private repository: TextRepository) {}

  /**
   * Guarda un texto generado por IA con todos sus metadatos
   */
  async saveGeneratedText(
    userId: number,
    generatedData: GeneratedTextResponse
  ): Promise<Texto> {
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
   * Obtiene un texto por ID
   */
  async getTextById(id: number): Promise<Texto | null> {
    return this.repository.getById(id)
  }

  /**
   * Obtiene todos los textos de un usuario
   */
  async getAllTextsByUser(userId: number): Promise<Texto[]> {
    return this.repository.getAllByUserId(userId)
  }

  /**
   * Obtiene las lecturas pendientes de un usuario
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
   * Obtiene lecturas por estado
   */
  async getReadingsByStatus(userId: number, status: TextStatus): Promise<ReadingDto[]> {
    const texts = await this.repository.getByUserIdAndStatus(userId, status)
    return texts.map((text) => text.toReadingDto())
  }

  /**
   * Verifica si el usuario puede generar más textos
   */
  async canUserGenerateMore(userId: number): Promise<boolean> {
    const pendingCount = await this.repository.countPendingByUserId(userId)
    return pendingCount < MAX_PENDING_TEXTS
  }

  /**
   * Obtiene el conteo de textos pendientes
   */
  async getPendingCount(userId: number): Promise<number> {
    return this.repository.countPendingByUserId(userId)
  }

  /**
   * Guarda el resultado de evaluación de comprensión
   */
  async saveEvaluationResult(
    textId: number,
    evaluation: EvaluationResult
  ): Promise<Texto | null> {
    return this.repository.updateEvaluationResult(textId, evaluation)
  }

  /**
   * Cuenta las palabras en un texto
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  /**
   * Obtiene el máximo de textos pendientes permitidos
   */
  getMaxPendingTexts(): number {
    return MAX_PENDING_TEXTS
  }

  /**
   * Elimina una lectura pendiente (soft delete)
   * Solo permite eliminar lecturas que están pendientes y pertenecen al usuario
   */
  async deleteReading(userId: number, textId: number): Promise<boolean> {
    const text = await this.repository.getById(textId)

    // Verificar que existe, pertenece al usuario y está pendiente
    if (!text || text.userId !== userId || text.status !== 'pending') {
      return false
    }

    return this.repository.softDelete(textId)
  }
}
