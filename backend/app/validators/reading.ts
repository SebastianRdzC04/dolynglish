import vine from '@vinejs/vine'

/**
 * Validador para los query params de generación de texto
 */
export const generateTextValidator = vine.compile(
  vine.object({
    category: vine
      .enum(['technology', 'history', 'education', 'programming', 'culture', 'pop_culture'])
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
  category?: 'technology' | 'history' | 'education' | 'programming' | 'culture' | 'pop_culture'
  size?: 'short' | 'medium' | 'long'
  difficulty?: 'easy' | 'medium' | 'hard'
  timePeriod?: string
  seed?: string
}

/**
 * Validador para explicación de selección de texto
 */
export const explainSelectionValidator = vine.compile(
  vine.object({
    selection: vine.string().trim().minLength(1).maxLength(200),
    type: vine.enum(['word', 'phrase', 'sentence']).optional(),
  })
)

/**
 * Tipo inferido del validador de explicación
 */
export type ExplainSelectionInput = {
  selection: string
  type?: 'word' | 'phrase' | 'sentence'
}
