import { Groq } from 'groq-sdk'
import env from '#start/env'
import { AIService, ChatMessage } from '../../types/ia_connector.js'

const groq = new Groq({
  apiKey: env.get('GROQ_API_KEY'),
})

export const groqService: AIService = {
  name: 'Groq',
  async chat(messages: ChatMessage[]) {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'qwen/qwen3-32b',
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true,
      stop: null,
    })

    return (async function* () {
      for await (const chunk of chatCompletion) {
        yield chunk.choices[0]?.delta?.content || ''
      }
    })()
  },
}
