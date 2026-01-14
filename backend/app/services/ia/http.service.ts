import type { Response } from '@adonisjs/core/http'
import { Readable } from 'node:stream'
import { AIService, ChatMessage } from '../../types/ia_connector.js'
import { groqService } from './groq.service.js'

class IAHttpService {
  private services: AIService[] = [groqService]
  private currentServiceIndex = 0

  private getNextService(): AIService {
    const service = this.services[this.currentServiceIndex]
    this.currentServiceIndex = (this.currentServiceIndex + 1) % this.services.length
    return service
  }

  async streamChat(messages: ChatMessage[], response: Response) {
    const service = this.getNextService()
    const stream = await service.chat(messages)

    response.header('Content-Type', 'text/event-stream')
    response.header('Cache-Control', 'no-cache')
    response.header('Connection', 'keep-alive')

    return response.stream(Readable.from(stream))
  }

  async streamChatWithCallback(
    messages: ChatMessage[],
    response: Response,
    onComplete: (fullText: string) => Promise<void>
  ) {
    const service = this.getNextService()
    const stream = await service.chat(messages)

    response.header('Content-Type', 'text/event-stream')
    response.header('Cache-Control', 'no-cache')
    response.header('Connection', 'keep-alive')

    let fullText = ''

    const wrappedStream = async function* () {
      for await (const chunk of stream) {
        fullText += chunk
        yield chunk
      }
      await onComplete(fullText)
    }

    return response.stream(Readable.from(wrappedStream()))
  }
}

export const iaHttpService = new IAHttpService()
