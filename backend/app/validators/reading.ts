import vine from '@vinejs/vine'

/**
 * Validator for reading generation request body.
 *
 * All fields are optional – the backend picks random defaults
 * for anything the user does not specify.
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
 * Validator for the comprehension evaluation request body.
 */
export const evaluateReadingValidator = vine.compile(
  vine.object({
    userResponse: vine.string().trim().minLength(1),
  })
)

/**
 * Validator for the streak query params.
 */
export const streakQueryValidator = vine.compile(
  vine.object({
    days: vine.number().positive().max(30).optional(),
  })
)

/**
 * Validator for text selection explanation request body.
 */
export const explainSelectionValidator = vine.compile(
  vine.object({
    selection: vine.string().trim().minLength(1).maxLength(200),
    type: vine.enum(['word', 'phrase', 'sentence']).optional(),
  })
)
