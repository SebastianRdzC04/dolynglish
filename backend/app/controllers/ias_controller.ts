import type { HttpContext } from '@adonisjs/core/http'
import { ChatMessage } from '../types/ia_connector.js'
import { iaHttpService } from '#services/ia/http.service'
import TextService from '#services/text.service'
import PromptGeneratorService from '#services/prompt_generator.service'
import PromptLogService from '#services/prompt_log.service'
import StreakService from '#services/streak.service'
import { inject } from '@adonisjs/core'
import { generateTextValidator } from '#validators/reading'
import type {
  ApiResponse,
  EvaluationResult,
  GeneratedTextResponse,
  PendingReadingsResponse,
  ReadingDto,
} from '../types/api_response.js'
import type { GenerationOptionsResponse } from '../types/prompt_generator.js'
import type { StreakEvaluationData } from '../types/streak.js'

@inject()
export default class IasController {
  constructor(
    private textService: TextService,
    private promptGenerator: PromptGeneratorService,
    private logService: PromptLogService,
    private streakService: StreakService
  ) {}

  async mensaje({ request, response }: HttpContext) {
    const { message } = request.body() as { message: string }
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'las preguntas de codigo solo contestalas en con python a pesar que te pidan otros lenguajes de programacion',
      },
      { role: 'user', content: message },
    ]

    return iaHttpService.streamChat(messages, response)
  }

  /**
   * Genera un nuevo texto de lectura en inglés
   * - Valida que el usuario no tenga más de 3 textos pendientes
   * - Genera título, descripción, contenido y categoría usando IA
   * - Guarda el texto en la base de datos
   * 
   * Query params opcionales:
   * - category: categoría específica
   * - size: tamaño del texto (short, medium, long)
   * - timePeriod: período temporal específico
   * - seed: para regenerar un prompt similar
   */
  async generateText({ request, response, auth }: HttpContext) {
    const user = auth.user!

    // Validar parámetros opcionales del query string
    const options = await generateTextValidator.validate(request.qs())

    const ALLOWED_CATEGORIES = ['technology', 'history', 'education', 'programming', 'culture', 'pop_culture']
    if (options.category && !ALLOWED_CATEGORIES.includes(options.category)) {
      return response.badRequest({
        message: 'Invalid category',
        data: null,
      } as ApiResponse)
    }

    // Validar límite de textos pendientes
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
      // Generar prompt con parámetros aleatorios usando el nuevo servicio
      const generatedPrompt = await this.promptGenerator.generatePrompt(
        {
          category: options.category,
          size: options.size,
          timePeriod: options.timePeriod,
          seed: options.seed,
        },
        user.id
      )

      const messages: ChatMessage[] = [
        { role: 'system', content: generatedPrompt.systemPrompt },
        { role: 'user', content: generatedPrompt.userPrompt },
      ]

      // Obtener respuesta completa de la IA
      const fullResponse = await iaHttpService.getFullResponse(messages)

      // Parsear JSON de la respuesta
      const generatedData = this.parseGeneratedTextResponse(fullResponse)

      // Garantizar que la categoría guardada sea la categoría solicitada en el prompt
      const requestedCategory = generatedPrompt.params.primaryCategory
      const aiReturnedCategory = generatedData.category

      if (generatedData.category !== requestedCategory) {
        // Log del mismatch para diagnóstico
        console.warn('Category mismatch between prompt and AI response', {
          userId: user.id,
          requestedCategory,
          aiReturnedCategory,
          seed: generatedPrompt.seed,
        })

        // Override: usamos la categoría del prompt como fuente de verdad
        generatedData.category = requestedCategory
      }

      // Guardar en base de datos con la categoría garantizada
      const saveStartTime = Date.now()
      const savedText = await this.textService.saveGeneratedText(user.id, generatedData)

      // Log del guardado exitoso
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
            aiReturnedCategory, // para trazabilidad
          },
        },
      } as ApiResponse)
    } catch (error) {
      console.error('Error generating text:', error)

      // Log del error de guardado si aplica
      if (error instanceof Error && error.message.includes('save')) {
        await this.logService.logTextSaveFailed(error, 'unknown', user.id)
      }

      // Mejor manejo de errores: si la IA devolvió una categoría inválida, mapear a 502
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
   * Evalúa la comprensión del usuario sobre un texto
   * - Obtiene el texto de la BD
   * - Envía a IA para evaluación
   * - Guarda el resultado (score, passed) en la BD
   */
  async responseText({ request, response, params, auth }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)
    const { userResponse } = request.body() as { userResponse: string }
    const startTime = Date.now()

    // Validar entrada
    if (!userResponse || userResponse.trim().length === 0) {
      return response.badRequest({
        message: 'User response is required',
        data: null,
      } as ApiResponse)
    }

    // Obtener texto de la BD
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

    // Verificar que el texto esté pendiente
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
      // Obtener evaluación de la IA
      const fullResponse = await iaHttpService.getFullResponse(messages)
      const evaluation = this.parseEvaluationResult(fullResponse)

      // Guardar resultado en la BD
      const updatedText = await this.textService.saveEvaluationResult(textId, evaluation)

      if (!updatedText) {
        return response.internalServerError({
          message: 'Failed to save evaluation result',
          data: null,
        } as ApiResponse)
      }

      // Log de evaluación completada
      await this.logService.logEvaluationCompleted(
        textId,
        user.id,
        evaluation.score,
        evaluation.passed,
        Date.now() - startTime
      )

      // Actualizar racha si el usuario pasó la evaluación
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
          // Log error pero no fallar la respuesta
          console.error('Error updating streak:', streakError)
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
      console.error('Error evaluating response:', error)

      // Log de error en evaluación
      await this.logService.logEvaluationFailed(error as Error, textId, user.id)

      return response.internalServerError({
        message: 'Failed to evaluate your response',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Obtiene las lecturas pendientes del usuario autenticado
   */
  async getPendingReadings({ response, auth }: HttpContext) {
    const user = auth.user!

    try {
      const pendingData = await this.textService.getPendingReadings(user.id)

      return response.ok({
        message: 'Pending readings retrieved successfully',
        data: pendingData,
      } as ApiResponse<PendingReadingsResponse>)
    } catch (error) {
      console.error('Error getting pending readings:', error)
      return response.internalServerError({
        message: 'Failed to retrieve pending readings',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Obtiene el historial de lecturas completadas del usuario
   */
  async getCompletedReadings({ response, auth }: HttpContext) {
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
      console.error('Error getting completed readings:', error)
      return response.internalServerError({
        message: 'Failed to retrieve completed readings',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Obtiene una lectura específica por ID
   */
  async getReading({ response, auth, params }: HttpContext) {
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
      console.error('Error getting reading:', error)
      return response.internalServerError({
        message: 'Failed to retrieve reading',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Obtiene las opciones disponibles para generación de texto
   * Este endpoint es público (no requiere autenticación)
   */
  async getGenerationOptions({ response }: HttpContext) {
    try {
      const options = this.promptGenerator.getGenerationOptions()

      return response.ok({
        message: 'Generation options retrieved successfully',
        data: options,
      } as ApiResponse<GenerationOptionsResponse>)
    } catch (error) {
      console.error('Error getting generation options:', error)
      return response.internalServerError({
        message: 'Failed to retrieve generation options',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Elimina una lectura pendiente (soft delete)
   * DELETE /readings/:id
   * Solo permite eliminar lecturas que están pendientes
   */
  async deleteReading({ response, auth, params }: HttpContext) {
    const user = auth.user!
    const textId = Number(params.id)

    if (isNaN(textId)) {
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

      return response.ok({
        message: 'Reading deleted successfully',
        data: null,
      } as ApiResponse)
    } catch (error) {
      console.error('Error deleting reading:', error)
      return response.internalServerError({
        message: 'Failed to delete reading',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Parsea la respuesta de generación de texto de la IA
   */
  private parseGeneratedTextResponse(rawResponse: string): GeneratedTextResponse {
    try {
      // Limpiar la respuesta de posibles caracteres extra
      const cleanedResponse = rawResponse
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)

      // Validar campos requeridos
      if (!parsed.title || !parsed.description || !parsed.content || !parsed.category) {
        throw new Error('Missing required fields in generated text response')
      }

      // Validar categoría: debe ser estrictamente una de las permitidas
      const ALLOWED_CATEGORIES = ['technology', 'history', 'education', 'programming', 'culture', 'pop_culture']
      // Normalizar: espacios/guiones -> underscore (ej: "pop culture" -> "pop_culture")
      let category = String(parsed.category ?? '').toLowerCase().trim()
      category = category.replace(/[\s-]+/g, '_')
      
      if (!ALLOWED_CATEGORIES.includes(category)) {
        throw new Error(`Invalid category returned by AI: ${parsed.category}`)
      }

      // Validar y normalizar dificultad
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
      console.error('Error parsing generated text response:', error, rawResponse)
      throw new Error('Failed to parse AI response for text generation')
    }
  }

  /**
   * Parsea la respuesta de evaluación de la IA
   */
  private parseEvaluationResult(rawResponse: string): EvaluationResult {
    try {
      const cleanedResponse = rawResponse
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)

      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0))
      const passed = score >= 80

      return {
        score,
        passed,
        feedback: parsed.feedback || (passed ? 'Great understanding!' : 'Keep practicing!'),
      }
    } catch (error) {
      console.error('Error parsing evaluation result:', error, rawResponse)
      throw new Error('Failed to parse AI response for evaluation')
    }
  }
}
