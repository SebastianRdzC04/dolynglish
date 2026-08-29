import { Injectable } from '@nestjs/common';

export type TextCategory = 'technology' | 'history' | 'education' | 'programming' | 'culture' | 'pop_culture';
export type TextDifficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedText {
  title: string;
  description: string;
  content: string;
  category: TextCategory;
  difficulty: TextDifficulty;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  feedback: string;
}

const ALLOWED_CATEGORIES: TextCategory[] = [
  'technology',
  'history',
  'education',
  'programming',
  'culture',
  'pop_culture',
];
const ALLOWED_DIFFICULTIES: TextDifficulty[] = ['easy', 'medium', 'hard'];

@Injectable()
export class AiResponseParserService {
  parseGeneratedText(rawResponse: string): GeneratedText {
    const parsed = this.extractJson(rawResponse) as Record<string, unknown>;

    if (!parsed.title || !parsed.description || !parsed.content || !parsed.category) {
      throw new Error('Missing required fields in generated text response');
    }

    const categoryNormalized = String(parsed.category)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '_');

    if (!ALLOWED_CATEGORIES.includes(categoryNormalized as TextCategory)) {
      throw new Error(`Invalid category: ${String(parsed.category)}`);
    }
    const category = categoryNormalized as TextCategory;

    const difficultyRaw = String(parsed.difficulty ?? '').toLowerCase();
    const difficulty: TextDifficulty = ALLOWED_DIFFICULTIES.includes(difficultyRaw as TextDifficulty)
      ? (difficultyRaw as TextDifficulty)
      : 'medium';

    return {
      title: String(parsed.title),
      description: String(parsed.description),
      content: String(parsed.content),
      category,
      difficulty,
    };
  }

  parseEvaluation(rawResponse: string): EvaluationResult {
    const parsed = this.extractJson(rawResponse) as Record<string, unknown>;
    const rawScore = Number(parsed.score);
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const feedback = String(parsed.feedback ?? '');
    return {
      score,
      passed: score >= 80,
      feedback,
    };
  }

  /**
   * Extracts the first JSON object from a string. Handles ```json``` fences.
   * Brace-matching so we don't truncate early on a string that contains `}`.
   */
  private extractJson(text: string): unknown {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = firstBrace; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          return JSON.parse(cleaned.slice(firstBrace, i + 1)) as unknown;
        }
      }
    }
    throw new Error('Unterminated JSON object in response');
  }
}
