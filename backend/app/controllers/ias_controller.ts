import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ChatMessage } from '../types/ia_connector.js'
import IAHttpService from '#services/ia/http.service'

/**
 * Debug / test controller for raw AI chat.
 *
 * All endpoints in this controller are mounted under the /test prefix
 * and should NOT be used by the production mobile app.
 */
@inject()
export default class IasController {
  constructor(private iaHttpService: IAHttpService) {}

  /**
   * Raw AI chat endpoint for testing purposes.
   * POST /test/mensaje
   */
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

    return this.iaHttpService.streamChat(messages, response)
  }
}
