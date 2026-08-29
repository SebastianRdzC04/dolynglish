import { test } from '@japa/runner'
import ExplanationPromptService from '#services/explanation_prompt.service'

const service = new ExplanationPromptService()

test.group('ExplanationPromptService', () => {
  test('buildSystemPrompt returns a non-empty string', ({ assert }) => {
    const prompt = service.buildSystemPrompt()

    assert.isString(prompt)
    assert.isTrue(prompt.length > 100)
  })

  test('buildSystemPrompt contains JSON schema instructions', ({ assert }) => {
    const prompt = service.buildSystemPrompt()

    assert.include(prompt, '"selection"')
    assert.include(prompt, '"explanation"')
    assert.include(prompt, '"simplifiedTerms"')
    assert.include(prompt, '"difficultyLevel"')
    assert.include(prompt, '"confidence"')
  })

  test('buildSystemPrompt mentions all difficulty levels', ({ assert }) => {
    const prompt = service.buildSystemPrompt()

    assert.include(prompt, 'easy')
    assert.include(prompt, 'medium')
    assert.include(prompt, 'hard')
  })

  test('buildUserPrompt includes the reading title and content', ({ assert }) => {
    const reading = {
      title: 'The Internet Revolution',
      content: 'The internet changed everything about how we communicate.',
      difficulty: 'medium' as const,
      category: 'technology' as const,
    }

    const prompt = service.buildUserPrompt(reading, 'communicate')

    assert.include(prompt, 'The Internet Revolution')
    assert.include(prompt, 'The internet changed everything')
    assert.include(prompt, 'communicate')
    assert.include(prompt, 'technology')
    assert.include(prompt, 'medium')
  })

  test('buildUserPrompt includes the selected text', ({ assert }) => {
    const reading = {
      title: 'Test',
      content: 'Some content with a difficult phrase here.',
      difficulty: 'hard' as const,
      category: 'education' as const,
    }

    const prompt = service.buildUserPrompt(reading, 'difficult phrase')

    assert.include(prompt, '"difficult phrase"')
  })

  test('buildUserPrompt adapts guidance to difficulty level', ({ assert }) => {
    const reading = {
      title: 'Test',
      content: 'Content',
      difficulty: 'easy' as const,
      category: 'culture' as const,
    }

    const prompt = service.buildUserPrompt(reading, 'word')

    assert.include(prompt, 'easy')
    assert.include(prompt, 'simple words')
  })
})
