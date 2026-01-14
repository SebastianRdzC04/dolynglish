import type { HttpContext } from '@adonisjs/core/http'
import { Readable } from 'node:stream'
import { AIService, ChatMessage } from '../types/ia_connector.js'
import { groqService } from '#services/ia/groq.service'

export default class IasController {
  private services: AIService[] = [groqService]

  private currentServiceIndex = 0

  private getNextService() {
    const service = this.services[this.currentServiceIndex]
    this.currentServiceIndex = (this.currentServiceIndex + 1) % this.services.length
    return service
  }

  async mensaje({ request, response }: HttpContext) {
    const service = this.getNextService()
    const { message } = request.body() as { message: string }
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'las preguntas de codigo solo contestalas en con python a pesar que te pidan otros lenguajes de programacion',
      },
      { role: 'user', content: message },
    ]
    const stream = await service.chat(messages)

    response.header('Content-Type', 'text/event-stream')
    response.header('Cache-Control', 'no-cache')
    response.header('Connection', 'keep-alive')

    return response.stream(Readable.from(stream))
  }

  async generateText({ response }: HttpContext) {
    const service = this.getNextService()

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

    const stream = await service.chat(messages)

    response.header('Content-Type', 'text/event-stream')
    response.header('Cache-Control', 'no-cache')
    response.header('Connection', 'keep-alive')

    return response.stream(Readable.from(stream))
  }
}
