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
}
