import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { ChatMessage } from '../types/ia_connector.js'
import IAHttpService from '#services/ia/http.service'
import TextService from '#services/text.service'
import PromptLogService from '#services/prompt_log.service'
import AiResponseParserService from '#services/ai_response_parser.service'
import ExplanationPromptService from '#services/explanation_prompt.service'
import { explainSelectionValidator } from '#validators/reading'
import type { ApiResponse, ExplanationResponse } from '../types/api_response.js'

@inject()
export default class ExplanationsController {
  constructor(
    private textService: TextService,
    private logService: PromptLogService,
    private parser: AiResponseParserService,
    private promptService: ExplanationPromptService,
    private iaHttpService: IAHttpService
  ) {}

  /**
   * Explain the meaning of a text selection in context.
   * POST /readings/:id/explanations
   *
   * Generates an English-only explanation adapted to the reading's difficulty level.
   * Rate-limited to 30 explanations per user per 24 hours.
   */
  async store({ request, response, params, auth }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)
    const startTime = Date.now()

    // Validate body
    const { selection } = await explainSelectionValidator.validate(request.body())

    // Fetch the reading
    const texto = await this.textService.getTextById(textId)

    if (!texto) {
      return response.notFound({
        message: 'Reading text not found',
        data: null,
      } as ApiResponse)
    }

    if (texto.userId !== user.id) {
      return response.forbidden({
        message: 'You do not have permission to access this text',
        data: null,
      } as ApiResponse)
    }

    // ── Rate limiting: 30 explanations per day ──────────────────────────────
    const DAILY_LIMIT = 30
    const rateLimitCheck = await this.logService.canUserRequestExplanation(user.id, DAILY_LIMIT)

    if (!rateLimitCheck.canRequest) {
      await this.logService.logExplanationRateLimited(
        textId,
        user.id,
        rateLimitCheck.usedToday,
        rateLimitCheck.limit
      )

      return response.tooManyRequests({
        message: `You have reached the daily limit of ${DAILY_LIMIT} explanations. Try again in 24 hours.`,
        data: {
          usedToday: rateLimitCheck.usedToday,
          limit: rateLimitCheck.limit,
          canRequest: false,
        },
      } as ApiResponse)
    }

    // Log the explanation request
    await this.logService.logExplanationRequested(textId, user.id, selection)

    // Build prompts using the dedicated service
    const systemPrompt = this.promptService.buildSystemPrompt()
    const userPrompt = this.promptService.buildUserPrompt(texto, selection)

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    try {
      const fullResponse = await this.iaHttpService.getFullResponse(messages)
      const explanation = this.parser.parseExplanation(fullResponse)

      const durationMs = Date.now() - startTime

      await this.logService.logExplanationCompleted(
        textId,
        user.id,
        selection,
        explanation.difficultyLevel,
        explanation.confidence,
        durationMs
      )

      return response.ok({
        message: 'Explanation generated successfully',
        data: explanation,
      } as ApiResponse<ExplanationResponse>)
    } catch (error) {
      await this.logService.logExplanationFailed(error as Error, textId, user.id, selection)

      logger.error({ err: error, textId, userId: user.id }, 'Failed to generate explanation')

      return response.internalServerError({
        message: 'Failed to generate explanation',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
