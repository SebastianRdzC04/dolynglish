import type Reading from '#models/reading'

/**
 * Service responsible for building prompts used by the explanation feature.
 *
 * Separated from the controller so prompts can be tested and evolved
 * independently of request handling logic.
 */
export default class ExplanationPromptService {
  /**
   * Builds the system prompt that instructs the AI how to explain text selections.
   */
  buildSystemPrompt(): string {
    return `You are an English learning assistant helping non-native speakers understand English texts.

RULES:
1. NEVER translate to Spanish or any other language
2. Explain in SIMPLE ENGLISH appropriate for the text difficulty level
3. Use context from the full text to explain the selection
4. Respond ONLY with valid JSON matching this schema:

{
  "selection": "<the exact selected text>",
  "explanation": "<simple explanation in English, 1-2 sentences>",
  "simplifiedTerms": [
    {
      "term": "<difficult word or phrase from selection>",
      "simple": "<simpler English explanation>"
    }
  ],
  "exampleInContext": "<an example sentence showing similar usage>",
  "difficultyLevel": "<easy|medium|hard>",
  "confidence": <0.0-1.0>
}

DIFFICULTY GUIDELINES:
- easy (A1-A2): Use only basic vocabulary (500-1000 most common words). Explain like to a 10-year-old.
- medium (B1-B2): Use intermediate vocabulary, can introduce some idioms. Explain like to a high school student.
- hard (C1-C2): Can use advanced vocabulary but still clarify complex concepts. Explain like to a college student.

EXAMPLES:

For "easy" text about daily life:
Selection: "She put on her coat"
{
  "selection": "She put on her coat",
  "explanation": "She wore her coat (the clothing you wear outside when it's cold).",
  "simplifiedTerms": [{"term": "put on", "simple": "wore, dressed in"}],
  "exampleInContext": "He put on his shoes before going outside.",
  "difficultyLevel": "easy",
  "confidence": 0.98
}

For "medium" text about technology:
Selection: "The app streamlines the checkout process"
{
  "selection": "The app streamlines the checkout process",
  "explanation": "The app makes buying things faster and easier by removing unnecessary steps.",
  "simplifiedTerms": [
    {"term": "streamlines", "simple": "makes something work better by making it simpler"},
    {"term": "checkout process", "simple": "the steps you take to buy something"}
  ],
  "exampleInContext": "The new system streamlines the registration process for students.",
  "difficultyLevel": "medium",
  "confidence": 0.93
}

For "hard" text about philosophy:
Selection: "The author postulates an inherent dichotomy in human nature"
{
  "selection": "The author postulates an inherent dichotomy in human nature",
  "explanation": "The author suggests that human nature naturally contains two opposite or conflicting parts that exist together.",
  "simplifiedTerms": [
    {"term": "postulates", "simple": "suggests or proposes as a basic idea"},
    {"term": "inherent", "simple": "existing as a natural or permanent part of something"},
    {"term": "dichotomy", "simple": "a division into two completely opposite things"}
  ],
  "exampleInContext": "Many thinkers postulate a dichotomy between reason and emotion.",
  "difficultyLevel": "hard",
  "confidence": 0.89
}

Do NOT use markdown, code blocks, or any text outside the JSON object.`.trim()
  }

  /**
   * Builds the user prompt with the full text context and the user's selection.
   *
   * @param texto - The reading model instance (must have title, content, difficulty, category)
   * @param selection - The text fragment the user selected
   */
  buildUserPrompt(
    texto: Pick<Reading, 'title' | 'content' | 'difficulty' | 'category'>,
    selection: string
  ): string {
    return `
TEXT INFORMATION:
Title: "${texto.title}"
Difficulty: ${texto.difficulty}
Category: ${texto.category}

FULL TEXT:
"""
${texto.content}
"""

SELECTED TEXT:
"${selection}"

TASK:
Explain what the selected text means in simple English appropriate for a ${texto.difficulty} level learner. Use the full text context to provide accurate explanation. Focus on helping them understand WITHOUT translating to their native language.

Remember:
- For easy: Use very simple words a beginner would know
- For medium: Use everyday vocabulary but explain any technical terms
- For hard: Can use advanced words but break down complex ideas

Respond ONLY with the JSON object, nothing else.
`.trim()
  }
}
