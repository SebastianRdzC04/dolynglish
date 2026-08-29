import type {
  EvaluationResult,
  ExplanationResponse,
  GeneratedTextResponse,
  TextCategory,
} from '../types/api_response.js'
import logger from '@adonisjs/core/services/logger'

/**
 * Service responsible for parsing raw AI responses into typed DTOs.
 *
 * Handles JSON extraction, cleaning (markdown code fences), field
 * validation, and normalisation (e.g. category / difficulty).
 */
export default class AiResponseParserService {
  /**
   * Parses raw AI output into a GeneratedTextResponse.
   *
   * - Strips markdown code fences
   * - Validates required fields (title, description, content, category)
   * - Normalises category (spaces/hyphens → underscores) and difficulty
   */
  parseGeneratedText(rawResponse: string): GeneratedTextResponse {
    try {
      const parsed = this.extractJson(rawResponse)

      if (!parsed.title || !parsed.description || !parsed.content || !parsed.category) {
        throw new Error('Missing required fields in generated text response')
      }

      // Normalise category: spaces / hyphens → underscore
      const ALLOWED_CATEGORIES: TextCategory[] = [
        'technology',
        'history',
        'education',
        'programming',
        'culture',
        'pop_culture',
      ]

      let categoryNormalized = String(parsed.category ?? '')
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_')

      if (!ALLOWED_CATEGORIES.includes(categoryNormalized as TextCategory)) {
        throw new Error(`Invalid category returned by AI: ${parsed.category}`)
      }

      const category = categoryNormalized as TextCategory

      // Normalise difficulty
      const validDifficulties = ['easy', 'medium', 'hard']
      const difficulty = validDifficulties.includes(parsed.difficulty?.toLowerCase())
        ? parsed.difficulty.toLowerCase()
        : 'medium'

      return {
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        category,
        difficulty,
      }
    } catch (error) {
      logger.error({ err: error, rawResponse }, 'Failed to parse generated text response')
      throw new Error('Failed to parse AI response for text generation')
    }
  }

  /**
   * Parses raw AI output into an EvaluationResult.
   *
   * - Clamps score to 0-100
   * - Derives `passed` from score (>= 80)
   */
  parseEvaluation(rawResponse: string): EvaluationResult {
    try {
      const parsed = this.extractJson(rawResponse)

      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0))
      const passed = score >= 80

      return {
        score,
        passed,
        feedback: parsed.feedback || (passed ? 'Great understanding!' : 'Keep practicing!'),
      }
    } catch (error) {
      logger.error({ err: error, rawResponse }, 'Failed to parse evaluation result')
      throw new Error('Failed to parse AI response for evaluation')
    }
  }

  /**
   * Parses raw AI output into an ExplanationResponse.
   *
   * - Validates required fields (selection, explanation)
   * - Ensures simplifiedTerms is a well-formed array
   * - Clamps confidence to 0-1
   */
  parseExplanation(rawResponse: string): ExplanationResponse {
    try {
      const parsed = this.extractJson(rawResponse)

      if (!parsed.selection || !parsed.explanation) {
        throw new Error('Missing required fields in explanation response')
      }

      // Ensure simplifiedTerms is a valid array of { term, simple }
      const simplifiedTerms = Array.isArray(parsed.simplifiedTerms) ? parsed.simplifiedTerms : []
      const validTerms = simplifiedTerms.filter(
        (t: any) => t && typeof t.term === 'string' && typeof t.simple === 'string'
      )

      return {
        selection: String(parsed.selection),
        explanation: String(parsed.explanation),
        simplifiedTerms: validTerms,
        exampleInContext: String(parsed.exampleInContext || ''),
        difficultyLevel: parsed.difficultyLevel || 'medium',
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.8)),
      }
    } catch (error) {
      logger.error({ err: error, rawResponse }, 'Failed to parse explanation response')
      throw new Error('Failed to parse AI response for explanation')
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Strips optional markdown code fences and parses JSON.
   */
  private extractJson(raw: string): any {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    return JSON.parse(cleaned)
  }
}
