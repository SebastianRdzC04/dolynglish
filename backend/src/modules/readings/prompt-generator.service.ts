import { Injectable } from '@nestjs/common';

export type CategoryId = 'technology' | 'history' | 'education' | 'programming' | 'culture' | 'pop_culture';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const CATEGORY_LABELS: Record<CategoryId, string> = {
  technology: 'Technology',
  history: 'History',
  education: 'Education',
  programming: 'Programming',
  culture: 'Culture',
  pop_culture: 'Pop culture',
};

const WORD_TARGETS: Record<DifficultyLevel, string> = {
  easy: '100-150',
  medium: '180-260',
  hard: '280-380',
};

const CEFR_BY_DIFFICULTY: Record<DifficultyLevel, readonly CefrLevel[]> = {
  easy: ['A2', 'B1'],
  medium: ['B2'],
  hard: ['C1', 'C2'],
};

export interface RandomPromptParams {
  category: CategoryId;
  difficulty: DifficultyLevel;
  cefrLevel: CefrLevel;
}

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
  seed: string;
  params: RandomPromptParams;
}

@Injectable()
export class PromptGeneratorService {
  buildPrompt(params: RandomPromptParams): GeneratedPrompt {
    return {
      systemPrompt: this.buildSystemPrompt(),
      userPrompt: this.buildUserPrompt(params),
      params,
      seed: this.generateSeed(params),
    };
  }

  generateRandomParams(): RandomPromptParams {
    const category = this.pickRandom<CategoryId>(
      Object.keys(CATEGORY_LABELS) as CategoryId[],
    );
    const difficulty = this.pickDifficulty();
    const cefrLevel = this.pickCefr(difficulty);
    return { category, difficulty, cefrLevel };
  }

  private buildSystemPrompt(): string {
    return `You are an English content generator for language learners.
Your task is to generate neutral, informative reading texts in English.
The text must be expository, not narrative.
Do not create stories or characters.
Do not use personal names or personal experiences.
Do not mention that you are an AI.

IMPORTANT: You must respond ONLY with a valid JSON object in this exact format:
{
  "title": "A short, engaging title for the text (max 100 characters)",
  "description": "A brief 1-2 sentence summary of what the text is about",
  "content": "The full reading text",
  "category": "technology | history | education | programming | culture | pop_culture",
  "difficulty": "easy | medium | hard"
}

No additional text, no markdown, no explanations. ONLY the JSON object.`;
  }

  private buildUserPrompt(params: RandomPromptParams): string {
    const label = CATEGORY_LABELS[params.category];
    const wordTarget = WORD_TARGETS[params.difficulty];
    return `Generate a ${params.difficulty} reading text in English about ${label}.
- CEFR level: ${params.cefrLevel}
- Length: approximately ${wordTarget} words
- Style: expository, informative, neutral
- Avoid: personal names, anecdotes, first-person narrative`;
  }

  private pickDifficulty(): DifficultyLevel {
    const r = Math.random();
    if (r < 0.5) return 'medium';
    if (r < 0.85) return 'easy';
    return 'hard';
  }

  private pickCefr(d: DifficultyLevel): CefrLevel {
    const choices = CEFR_BY_DIFFICULTY[d];
    return this.pickRandom<CefrLevel>([...choices]);
  }

  private pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error('pickRandom called with empty array');
    }
    const idx = Math.floor(Math.random() * arr.length);
    const value = arr[idx];
    if (value === undefined) {
      throw new Error('pickRandom returned undefined despite non-empty array');
    }
    return value;
  }

  private sequence = 0;

  private generateSeed(params: RandomPromptParams): string {
    this.sequence += 1;
    return `${params.category}_${params.difficulty}_${params.cefrLevel}_${Date.now()}_${this.sequence}`;
  }
}
