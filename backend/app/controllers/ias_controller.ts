import type { HttpContext } from '@adonisjs/core/http'
import { ChatMessage } from '../types/ia_connector.js'
import { iaHttpService } from '#services/ia/http.service'
import TextService from '#services/text.service'
import { inject } from '@adonisjs/core'

@inject()
export default class IasController {
  constructor(private textService: TextService) {}
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

  async generateText({ response, auth }: HttpContext) {
    const user = auth.user!

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `
You are an English content generator for language learners.
Your task is to generate neutral, informative reading texts in English.
The text must be expository, not narrative.
Do not create stories or characters.
Do not use personal names or personal experiences.
Do not mention that you are an AI.
    `.trim(),
      },
      {
        role: 'user',
        content: `
Generate a single reading text in English with the following constraints:

- Level: B1–B2 (intermediate)
- Length: 250–350 words
- Topic: programming, technology, history, science, or education
- Style: informative and explanatory, similar to a short article
- Tone: neutral and engaging

Rules:
- Do NOT tell a story
- Do NOT include characters, names, or personal experiences
- Do NOT write in first or third person narrative form
- Do NOT include titles, questions, lists, or bullet points
- Do NOT include explanations about the task
- Output ONLY the text
    `.trim(),
      },
    ]

    return iaHttpService.streamChatWithCallback(messages, response, async (fullText) => {
      await this.textService.saveGeneratedText(user.id, fullText)
    })
  }

  async responseText({ request, response, params, auth }: HttpContext) {
    const user = auth.user!
    const textId = params.id
    const { userResponse } = request.body() as { userResponse: string }

    const texto = await this.textService.getTextById(textId)

    if (!texto) {
      return response.notFound({ error: 'Text not found' })
    }

    if (texto.userId !== user.id) {
      return response.forbidden({ error: 'You do not have permission to access this text' })
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `
You are an English comprehension evaluator for language learners.
Your task is to evaluate if the user correctly understood the main idea of a given text.
You must respond ONLY with a JSON object in this exact format: {"score": <number>, "passed": <boolean>}
- "score" is a number from 0 to 100 representing how well the user understood the text
- "passed" is true if score >= 80, false otherwise
Do not include any other text, explanation, or formatting. Only the JSON object.
        `.trim(),
      },
      {
        role: 'user',
        content: `
Here is the original text the user read:
"""
${texto.texto}
"""

Here is the user's response about the main idea of the text:
"""
${userResponse}
"""

Evaluate how well the user understood the main idea of the text. Respond ONLY with the JSON object.
        `.trim(),
      },
    ]

    return iaHttpService.streamChat(messages, response)
  }
}
