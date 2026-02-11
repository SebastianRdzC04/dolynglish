import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { ChatMessage } from '../types/ia_connector.js'
import IAHttpService from '#services/ia/http.service'
import TextService from '#services/text.service'
import PromptGeneratorService from '#services/prompt_generator.service'
import PromptLogService from '#services/prompt_log.service'
import StreakService from '#services/streak.service'
import AiResponseParserService from '#services/ai_response_parser.service'
import { generateTextValidator, evaluateReadingValidator } from '#validators/reading'
import type {
  ApiResponse,
  PendingReadingsResponse,
  ReadingDto,
} from '../types/api_response.js'
import type { GenerationOptionsResponse } from '../types/prompt_generator.js'
import type { StreakEvaluationData } from '../types/streak.js'

@inject()
export default class ReadingsController {
  constructor(
    private textService: TextService,
    private promptGenerator: PromptGeneratorService,
    private logService: PromptLogService,
    private streakService: StreakService,
    private parser: AiResponseParserService,
    private iaHttpService: IAHttpService
  ) {}

  /**
   * Generate a new English reading text via AI.
   * POST /readings
   *
   * Accepts an optional JSON body with: category, size, difficulty, timePeriod, seed.
   * Validates the user does not exceed the pending-readings limit before generating.
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.user!

    // Validate optional body params (was previously query string)
    const options = await generateTextValidator.validate(request.body())

    // Check pending-readings limit
    const canGenerate = await this.textService.canUserGenerateMore(user.id)
    if (!canGenerate) {
      const pendingCount = await this.textService.getPendingCount(user.id)
      const maxPending = this.textService.getMaxPendingTexts()

      return response.badRequest({
        message: `You have reached the maximum of ${maxPending} pending readings. Complete some before generating more.`,
        data: {
          pendingCount,
          maxPending,
          canGenerateMore: false,
        },
      } as ApiResponse)
    }

    try {
      // Build prompt with (optionally constrained) random parameters
      const generatedPrompt = await this.promptGenerator.generatePrompt(
        {
          category: options.category,
          size: options.size,
          timePeriod: options.timePeriod,
          difficulty: options.difficulty,
          seed: options.seed,
        },
        user.id
      )

      const messages: ChatMessage[] = [
        { role: 'system', content: generatedPrompt.systemPrompt },
        { role: 'user', content: generatedPrompt.userPrompt },
      ]

      // Get full (non-streaming) AI response
      const fullResponse = await this.iaHttpService.getFullResponse(messages)

      // Parse JSON from the AI response
      const generatedData = this.parser.parseGeneratedText(fullResponse)

      // Guarantee saved category matches what the prompt requested
      const requestedCategory = generatedPrompt.params.primaryCategory
      const aiReturnedCategory = generatedData.category

      if (generatedData.category !== requestedCategory) {
        logger.warn(
          { userId: user.id, requestedCategory, aiReturnedCategory, seed: generatedPrompt.seed },
          'Category mismatch between prompt and AI response'
        )
        generatedData.category = requestedCategory
      }

      // Guarantee saved difficulty matches what the prompt requested
      try {
        const requestedDifficulty = generatedPrompt.params?.difficulty?.id
        const aiReturnedDifficulty = generatedData.difficulty
        if (requestedDifficulty && aiReturnedDifficulty !== requestedDifficulty) {
          logger.warn(
            { userId: user.id, requestedDifficulty, aiReturnedDifficulty, seed: generatedPrompt.seed },
            'Difficulty mismatch between prompt and AI response'
          )
          generatedData.difficulty = requestedDifficulty
        }
      } catch (e) {
        logger.warn({ err: e }, 'Could not enforce requested difficulty')
      }

      // Persist to database
      const saveStartTime = Date.now()
      const savedText = await this.textService.saveGeneratedText(user.id, generatedData)

      await this.logService.logTextSaved(
        savedText.id,
        generatedPrompt.seed,
        user.id,
        Date.now() - saveStartTime
      )

      const readingDto: ReadingDto = {
        ...savedText.toReadingDto(),
        seed: generatedPrompt.seed,
      } as ReadingDto & { seed: string }

      return response.created({
        message: 'Reading text generated successfully',
        data: {
          ...readingDto,
          seed: generatedPrompt.seed,
          generationParams: {
            category: generatedPrompt.params.primaryCategory,
            subcategories: generatedPrompt.params.subcategories,
            size: generatedPrompt.params.textSize.label,
            difficulty: generatedPrompt.params.difficulty.id,
            cefrLevel: generatedPrompt.params.difficulty.cefrLevels.join('-'),
            timePeriod: generatedPrompt.params.timePeriod?.name,
            contentType: generatedPrompt.params.contentType,
            aiReturnedCategory,
          },
        },
      } as ApiResponse)
    } catch (error) {
      logger.error({ err: error }, 'Error generating text')

      if (error instanceof Error && error.message.includes('save')) {
        await this.logService.logTextSaveFailed(error, 'unknown', user.id)
      }

      if (error instanceof Error && error.message.includes('Invalid category returned by AI')) {
        return response.status(502).send({
          message: 'AI returned invalid category',
          error: error.message,
        })
      }

      return response.internalServerError({
        message: 'Failed to generate reading text',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Evaluate user comprehension of a reading.
   * POST /readings/:id/evaluate
   */
  async evaluate({ request, response, params, auth }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)
    const startTime = Date.now()

    // Validate body through VineJS (replaces manual check + unsafe cast)
    const { userResponse } = await evaluateReadingValidator.validate(request.body())

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

    if (texto.status === 'completed') {
      return response.badRequest({
        message: 'This reading has already been completed',
        data: {
          score: texto.score,
          passed: texto.passed,
        },
      } as ApiResponse)
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `
You are an English comprehension evaluator for language learners.
Your task is to evaluate if the user correctly understood the main idea of a given text.
You must respond ONLY with a JSON object in this exact format: {"score": <number>, "passed": <boolean>, "feedback": "<string>"}
- "score" is a number from 0 to 100 representing how well the user understood the text
- "passed" is true if score >= 80, false otherwise
- "feedback" is a brief (1-2 sentences) explanation of the evaluation
Do not include any other text, explanation, or formatting. Only the JSON object.
        `.trim(),
      },
      {
        role: 'user',
        content: `
Here is the original text the user read:
"""
Title: ${texto.title}

${texto.content}
"""

Here is the user's response about what they understood from the text:
"""
${userResponse}
"""

Evaluate how well the user understood the main idea of the text. Respond ONLY with the JSON object.
        `.trim(),
      },
    ]

    try {
      const fullResponse = await this.iaHttpService.getFullResponse(messages)
      const evaluation = this.parser.parseEvaluation(fullResponse)

      const updatedText = await this.textService.saveEvaluationResult(textId, evaluation)

      if (!updatedText) {
        return response.internalServerError({
          message: 'Failed to save evaluation result',
          data: null,
        } as ApiResponse)
      }

      await this.logService.logEvaluationCompleted(
        textId,
        user.id,
        evaluation.score,
        evaluation.passed,
        Date.now() - startTime
      )

      // Update streak if the user passed
      let streakData: StreakEvaluationData | null = null
      if (evaluation.passed) {
        try {
          const streakResult = await this.streakService.updateStreakOnPass(user.id)
          streakData = {
            currentStreak: streakResult.newStreak,
            streakExtended: streakResult.streakExtended,
            todayCompleted: true,
          }
        } catch (streakError) {
          logger.error({ err: streakError }, 'Error updating streak')
        }
      }

      return response.ok({
        message: evaluation.passed
          ? 'Congratulations! You passed the comprehension test.'
          : 'Keep practicing! You need a score of 80 or higher to pass.',
        data: {
          score: evaluation.score,
          passed: evaluation.passed,
          feedback: evaluation.feedback,
          reading: updatedText.toReadingDto(),
          ...(streakData && { streak: streakData }),
        },
      } as ApiResponse)
    } catch (error) {
      logger.error({ err: error }, 'Error evaluating response')
      await this.logService.logEvaluationFailed(error as Error, textId, user.id)

      return response.internalServerError({
        message: 'Failed to evaluate your response',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * List the authenticated user's pending readings.
   * GET /readings/pending
   */
  async pending({ response, auth }: HttpContext) {
    const user = auth.user!

    try {
      const pendingData = await this.textService.getPendingReadings(user.id)

      return response.ok({
        message: 'Pending readings retrieved successfully',
        data: pendingData,
      } as ApiResponse<PendingReadingsResponse>)
    } catch (error) {
      logger.error({ err: error }, 'Error getting pending readings')
      return response.internalServerError({
        message: 'Failed to retrieve pending readings',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * List the authenticated user's completed readings.
   * GET /readings/completed
   */
  async completed({ response, auth }: HttpContext) {
    const user = auth.user!

    try {
      const completedReadings = await this.textService.getReadingsByStatus(user.id, 'completed')

      return response.ok({
        message: 'Completed readings retrieved successfully',
        data: {
          readings: completedReadings,
          count: completedReadings.length,
        },
      } as ApiResponse)
    } catch (error) {
      logger.error({ err: error }, 'Error getting completed readings')
      return response.internalServerError({
        message: 'Failed to retrieve completed readings',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get a single reading by ID.
   * GET /readings/:id
   */
  async show({ response, auth, params }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)

    try {
      const texto = await this.textService.getTextById(textId)

      if (!texto) {
        return response.notFound({
          message: 'Reading not found',
          data: null,
        } as ApiResponse)
      }

      if (texto.userId !== user.id) {
        return response.forbidden({
          message: 'You do not have permission to access this reading',
          data: null,
        } as ApiResponse)
      }

      return response.ok({
        message: 'Reading retrieved successfully',
        data: texto.toReadingDto(),
      } as ApiResponse<ReadingDto>)
    } catch (error) {
      logger.error({ err: error }, 'Error getting reading')
      return response.internalServerError({
        message: 'Failed to retrieve reading',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Soft-delete a pending reading.
   * DELETE /readings/:id → 204 No Content
   */
  async destroy({ response, auth, params }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)

    if (Number.isNaN(textId)) {
      return response.badRequest({
        message: 'Invalid reading ID',
        data: null,
      } as ApiResponse)
    }

    try {
      const deleted = await this.textService.deleteReading(user.id, textId)

      if (!deleted) {
        return response.notFound({
          message: 'Reading not found or cannot be deleted. Only pending readings can be deleted.',
          data: null,
        } as ApiResponse)
      }

      // 204 No Content – no body
      return response.noContent()
    } catch (error) {
      logger.error({ err: error }, 'Error deleting reading')
      return response.internalServerError({
        message: 'Failed to delete reading',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get available generation options (categories, sizes, time periods).
   * GET /readings/options — public, no auth required.
   */
  async options({ response }: HttpContext) {
    try {
      const opts = this.promptGenerator.getGenerationOptions()

      return response.ok({
        message: 'Generation options retrieved successfully',
        data: opts,
      } as ApiResponse<GenerationOptionsResponse>)
    } catch (error) {
      logger.error({ err: error }, 'Error getting generation options')
      return response.internalServerError({
        message: 'Failed to retrieve generation options',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
