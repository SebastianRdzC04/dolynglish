import { test } from '@japa/runner'
import AiResponseParserService from '#services/ai_response_parser.service'

const parser = new AiResponseParserService()

// ─── parseGeneratedText ─────────────────────────────────────────────────────

test.group('AiResponseParserService | parseGeneratedText', () => {
  test('parses valid JSON response', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'The Internet',
      description: 'A short text about the internet',
      content: 'The internet is a global network.',
      category: 'technology',
      difficulty: 'easy',
    })

    const result = parser.parseGeneratedText(raw)

    assert.equal(result.title, 'The Internet')
    assert.equal(result.description, 'A short text about the internet')
    assert.equal(result.content, 'The internet is a global network.')
    assert.equal(result.category, 'technology')
    assert.equal(result.difficulty, 'easy')
  })

  test('strips markdown code fences', ({ assert }) => {
    const raw =
      '```json\n' +
      JSON.stringify({
        title: 'Test',
        description: 'Desc',
        content: 'Content here',
        category: 'history',
        difficulty: 'medium',
      }) +
      '\n```'

    const result = parser.parseGeneratedText(raw)
    assert.equal(result.title, 'Test')
    assert.equal(result.category, 'history')
  })

  test('normalises category with spaces to underscores', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      content: 'Content',
      category: 'pop culture',
      difficulty: 'easy',
    })

    const result = parser.parseGeneratedText(raw)
    assert.equal(result.category, 'pop_culture')
  })

  test('normalises category with hyphens to underscores', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      content: 'Content',
      category: 'pop-culture',
      difficulty: 'easy',
    })

    const result = parser.parseGeneratedText(raw)
    assert.equal(result.category, 'pop_culture')
  })

  test('defaults difficulty to medium when invalid', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      content: 'Content',
      category: 'technology',
      difficulty: 'extreme',
    })

    const result = parser.parseGeneratedText(raw)
    assert.equal(result.difficulty, 'medium')
  })

  test('defaults difficulty to medium when missing', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      content: 'Content',
      category: 'technology',
    })

    const result = parser.parseGeneratedText(raw)
    assert.equal(result.difficulty, 'medium')
  })

  test('throws when required field title is missing', ({ assert }) => {
    const raw = JSON.stringify({
      description: 'Desc',
      content: 'Content',
      category: 'technology',
    })

    assert.throws(
      () => parser.parseGeneratedText(raw),
      'Failed to parse AI response for text generation'
    )
  })

  test('throws when required field content is missing', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      category: 'technology',
    })

    assert.throws(
      () => parser.parseGeneratedText(raw),
      'Failed to parse AI response for text generation'
    )
  })

  test('throws on invalid JSON', ({ assert }) => {
    assert.throws(() => parser.parseGeneratedText('not json at all'))
  })

  test('throws on invalid category', ({ assert }) => {
    const raw = JSON.stringify({
      title: 'Test',
      description: 'Desc',
      content: 'Content',
      category: 'cooking',
      difficulty: 'easy',
    })

    assert.throws(
      () => parser.parseGeneratedText(raw),
      'Failed to parse AI response for text generation'
    )
  })
})

// ─── parseEvaluation ────────────────────────────────────────────────────────

test.group('AiResponseParserService | parseEvaluation', () => {
  test('parses valid evaluation', ({ assert }) => {
    const raw = JSON.stringify({
      score: 85,
      passed: true,
      feedback: 'Great understanding!',
    })

    const result = parser.parseEvaluation(raw)

    assert.equal(result.score, 85)
    assert.isTrue(result.passed)
    assert.equal(result.feedback, 'Great understanding!')
  })

  test('clamps score above 100 to 100', ({ assert }) => {
    const raw = JSON.stringify({
      score: 150,
      passed: true,
      feedback: 'Perfect!',
    })

    const result = parser.parseEvaluation(raw)
    assert.equal(result.score, 100)
  })

  test('clamps score below 0 to 0', ({ assert }) => {
    const raw = JSON.stringify({
      score: -10,
      passed: false,
      feedback: 'Needs work.',
    })

    const result = parser.parseEvaluation(raw)
    assert.equal(result.score, 0)
  })

  test('derives passed from score when score >= 80', ({ assert }) => {
    const raw = JSON.stringify({
      score: 80,
      passed: false, // AI says false but score is 80
      feedback: 'Good',
    })

    const result = parser.parseEvaluation(raw)
    assert.isTrue(result.passed)
  })

  test('derives passed from score when score < 80', ({ assert }) => {
    const raw = JSON.stringify({
      score: 79,
      passed: true, // AI says true but score is 79
      feedback: 'Almost',
    })

    const result = parser.parseEvaluation(raw)
    assert.isFalse(result.passed)
  })

  test('provides default feedback when missing', ({ assert }) => {
    const raw = JSON.stringify({
      score: 50,
      passed: false,
    })

    const result = parser.parseEvaluation(raw)
    assert.isString(result.feedback)
    assert.isTrue((result.feedback ?? '').length > 0)
  })

  test('strips markdown code fences', ({ assert }) => {
    const raw = '```json\n{"score": 90, "passed": true, "feedback": "Well done"}\n```'

    const result = parser.parseEvaluation(raw)
    assert.equal(result.score, 90)
  })

  test('throws on invalid JSON', ({ assert }) => {
    assert.throws(() => parser.parseEvaluation('bad data'))
  })
})

// ─── parseExplanation ───────────────────────────────────────────────────────

test.group('AiResponseParserService | parseExplanation', () => {
  test('parses valid explanation', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'put on',
      explanation: 'To wear something',
      simplifiedTerms: [{ term: 'put on', simple: 'wear' }],
      exampleInContext: 'He put on his jacket.',
      difficultyLevel: 'easy',
      confidence: 0.95,
    })

    const result = parser.parseExplanation(raw)

    assert.equal(result.selection, 'put on')
    assert.equal(result.explanation, 'To wear something')
    assert.lengthOf(result.simplifiedTerms, 1)
    assert.equal(result.simplifiedTerms[0].term, 'put on')
    assert.equal(result.exampleInContext, 'He put on his jacket.')
    assert.equal(result.difficultyLevel, 'easy')
    assert.equal(result.confidence, 0.95)
  })

  test('clamps confidence above 1.0 to 1.0', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      explanation: 'A unit of language',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: 'medium',
      confidence: 1.5,
    })

    const result = parser.parseExplanation(raw)
    assert.equal(result.confidence, 1.0)
  })

  test('clamps confidence below 0 to 0', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      explanation: 'A unit of language',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: 'medium',
      confidence: -0.5,
    })

    const result = parser.parseExplanation(raw)
    assert.equal(result.confidence, 0)
  })

  test('passes through difficultyLevel as-is (no validation)', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      explanation: 'A unit of language',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: 'ultra',
      confidence: 0.8,
    })

    const result = parser.parseExplanation(raw)
    // The parser does not validate difficultyLevel, just uses it or defaults to 'medium' if falsy
    assert.equal(result.difficultyLevel, 'ultra')
  })

  test('defaults difficultyLevel to medium when falsy', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      explanation: 'A unit of language',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: '',
      confidence: 0.8,
    })

    const result = parser.parseExplanation(raw)
    assert.equal(result.difficultyLevel, 'medium')
  })

  test('filters out invalid simplifiedTerms entries', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      explanation: 'A unit of language',
      simplifiedTerms: [
        { term: 'valid', simple: 'ok' },
        { term: '', simple: 'missing term' }, // empty string is still a valid string type
        { noterm: 'invalid' },
        'just a string',
      ],
      exampleInContext: 'Example',
      difficultyLevel: 'easy',
      confidence: 0.7,
    })

    const result = parser.parseExplanation(raw)
    // Filter keeps entries where term and simple are typeof string (even empty)
    // Removes entries missing term/simple keys entirely, and non-object entries
    assert.lengthOf(result.simplifiedTerms, 2)
    assert.equal(result.simplifiedTerms[0].term, 'valid')
    assert.equal(result.simplifiedTerms[1].term, '')
  })

  test('throws when selection is missing', ({ assert }) => {
    const raw = JSON.stringify({
      explanation: 'A unit of language',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: 'easy',
      confidence: 0.7,
    })

    assert.throws(() => parser.parseExplanation(raw))
  })

  test('throws when explanation is missing', ({ assert }) => {
    const raw = JSON.stringify({
      selection: 'word',
      simplifiedTerms: [],
      exampleInContext: 'Example',
      difficultyLevel: 'easy',
      confidence: 0.7,
    })

    assert.throws(() => parser.parseExplanation(raw))
  })

  test('throws on invalid JSON', ({ assert }) => {
    assert.throws(() => parser.parseExplanation('invalid'))
  })
})
