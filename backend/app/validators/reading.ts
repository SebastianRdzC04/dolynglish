import vine from '@vinejs/vine'

/**
 * Validador para los query params de generación de texto
 */
export const generateTextValidator = vine.compile(
  vine.object({
    category: vine
      .enum(['technology', 'science', 'history', 'education', 'programming', 'health', 'culture', 'pop_culture'])
      .optional(),
    size: vine.enum(['short', 'medium', 'long']).optional(),
    difficulty: vine.enum(['easy', 'medium', 'hard']).optional(),
    timePeriod: vine.string().optional(),
    seed: vine.string().optional(),
  })
)

/**
 * Tipo inferido del validador
 */
export type GenerateTextInput = {
  category?: 'technology' | 'science' | 'history' | 'education' | 'programming' | 'health' | 'culture' | 'pop_culture'
  size?: 'short' | 'medium' | 'long'
  difficulty?: 'easy' | 'medium' | 'hard'
  timePeriod?: string
  seed?: string
}
