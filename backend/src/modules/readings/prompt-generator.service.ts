import { Injectable } from '@nestjs/common';

/**
 * Domain enums for the reading generation pipeline.
 *
 * The vocabulary/grammar guidelines and the word count ranges below are
 * what actually get rendered into the prompt sent to the LLM. This is
 * where the contract between "user picks a difficulty" and "the LLM writes
 * at that level" lives.
 */
export type CategoryId =
  'technology' | 'history' | 'education' | 'programming' | 'culture' | 'pop_culture';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type TextSize = 'short' | 'medium' | 'long';

export type ContentType =
  | 'historical_fact'
  | 'interesting_discovery'
  | 'how_it_works'
  | 'comparison'
  | 'evolution'
  | 'curious_phenomenon'
  | 'practical_application';

export type ContentPerspective =
  'causes' | 'effects' | 'process' | 'comparison' | 'evolution' | 'benefits' | 'challenges';

export type GeographicRegion = 'global' | 'europe' | 'asia' | 'americas' | 'africa' | 'oceania';

export const CEFR_BY_DIFFICULTY: Record<DifficultyLevel, readonly CefrLevel[]> = {
  easy: ['A2', 'B1'],
  medium: ['B2'],
  hard: ['C1', 'C2'],
};

export const READING_CATEGORIES: readonly CategoryId[] = [
  'technology',
  'history',
  'education',
  'programming',
  'culture',
  'pop_culture',
] as const;

export const READING_DIFFICULTIES: readonly DifficultyLevel[] = ['easy', 'medium', 'hard'] as const;

export const READING_TEXT_SIZES: readonly TextSize[] = ['short', 'medium', 'long'] as const;

export const READING_CEFR_LEVELS: readonly CefrLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Text size configuration: word count + reading time per size
// ─────────────────────────────────────────────────────────────────────────────

interface TextSizeConfig {
  min: number;
  max: number;
  label: TextSize;
  readingTime: string;
}

const TEXT_SIZES: Record<TextSize, TextSizeConfig> = {
  short: { min: 80, max: 120, label: 'short', readingTime: '~1 min' },
  medium: { min: 150, max: 220, label: 'medium', readingTime: '~2 min' },
  long: { min: 250, max: 350, label: 'long', readingTime: '~3 min' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty configuration: vocabulary + grammar guidelines per level
// ─────────────────────────────────────────────────────────────────────────────

interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  cefrLevels: readonly CefrLevel[];
  description: string;
  vocabularyGuidelines: string;
  grammarGuidelines: string;
}

const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Beginner',
    cefrLevels: ['A1', 'A2'],
    description: 'A1-A2 level (Beginner to Elementary)',
    vocabularyGuidelines:
      'Use only basic, everyday vocabulary (around 500-1000 most common words). Avoid idioms, phrasal verbs, and technical terms.',
    grammarGuidelines:
      'Use simple present, simple past, and simple future. Short sentences (8-12 words). Avoid complex structures like conditionals, passive voice, or relative clauses.',
  },
  medium: {
    id: 'medium',
    label: 'Intermediate',
    cefrLevels: ['B1', 'B2'],
    description: 'B1-B2 level (Intermediate to Upper-Intermediate)',
    vocabularyGuidelines:
      'Use intermediate vocabulary with some less common words. Include common idioms and phrasal verbs. Topic-specific vocabulary is acceptable with context.',
    grammarGuidelines:
      'Use a variety of tenses including perfect tenses and conditionals. Medium-length sentences (12-20 words). Can include passive voice and relative clauses.',
  },
  hard: {
    id: 'hard',
    label: 'Advanced',
    cefrLevels: ['C1', 'C2'],
    description: 'C1-C2 level (Advanced to Proficiency)',
    vocabularyGuidelines:
      'Use sophisticated vocabulary including academic and specialized terms. Include idiomatic expressions, collocations, and nuanced word choices.',
    grammarGuidelines:
      'Use complex grammatical structures freely: mixed conditionals, subjunctive, cleft sentences, inversion. Longer, compound-complex sentences are encouraged.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Categories with subcategories: the LLM gets a focused topic, not just "Technology"
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryConfig {
  id: CategoryId;
  name: string;
  subcategories: { id: string; name: string }[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'technology',
    name: 'Technology',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones and Mobile Technology' },
      { id: 'ai', name: 'Artificial Intelligence' },
      { id: 'cybersecurity', name: 'Cybersecurity' },
      { id: 'social_media', name: 'Social Media' },
      { id: 'robotics', name: 'Robotics' },
      { id: 'cloud', name: 'Cloud Computing' },
      { id: 'iot', name: 'Internet of Things' },
      { id: 'vr_ar', name: 'Virtual and Augmented Reality' },
    ],
  },
  {
    id: 'history',
    name: 'History',
    subcategories: [
      { id: 'ancient', name: 'Ancient Civilizations' },
      { id: 'medieval', name: 'Medieval Period' },
      { id: 'wars', name: 'Wars and Conflicts' },
      { id: 'industrial', name: 'Industrial Revolution' },
      { id: 'cultural', name: 'Cultural Movements' },
      { id: 'inventions', name: 'Famous Inventions' },
      { id: 'exploration', name: 'Exploration and Discovery' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    subcategories: [
      { id: 'learning', name: 'Learning Methods' },
      { id: 'online', name: 'Online Education' },
      { id: 'study', name: 'Study Techniques' },
      { id: 'psychology', name: 'Educational Psychology' },
      { id: 'languages', name: 'Language Learning' },
      { id: 'skills', name: 'Skills Development' },
    ],
  },
  {
    id: 'programming',
    name: 'Programming',
    subcategories: [
      { id: 'web', name: 'Web Development' },
      { id: 'databases', name: 'Databases' },
      { id: 'algorithms', name: 'Algorithms' },
      { id: 'software', name: 'Software Engineering' },
      { id: 'mobile', name: 'Mobile Development' },
      { id: 'devops', name: 'DevOps' },
      { id: 'security', name: 'Software Security' },
    ],
  },
  {
    id: 'culture',
    name: 'Culture',
    subcategories: [
      { id: 'music', name: 'Music' },
      { id: 'art', name: 'Visual Arts' },
      { id: 'literature', name: 'Literature' },
      { id: 'traditions', name: 'Traditions and Customs' },
      { id: 'cinema', name: 'Cinema' },
      { id: 'gastronomy', name: 'Gastronomy' },
      { id: 'architecture', name: 'Architecture' },
    ],
  },
  {
    id: 'pop_culture',
    name: 'Pop Culture',
    subcategories: [
      { id: 'anime_manga', name: 'Anime and Manga' },
      { id: 'disney', name: 'Disney' },
      { id: 'marvel', name: 'Marvel Universe' },
      { id: 'dc', name: 'DC Universe' },
      { id: 'pixar', name: 'Pixar Animation' },
      { id: 'gaming', name: 'Video Games' },
      { id: 'kpop', name: 'K-Pop and Asian Pop Culture' },
      { id: 'scifi_fantasy', name: 'Sci-Fi and Fantasy Franchises' },
      { id: 'fun_facts', name: 'Fun Facts and Trivia' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Content type, perspective, and unique focus angle — randomized server-side
// so the LLM always gets a non-trivial angle on the chosen topic.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_TYPE_DESCRIPTIONS: Record<ContentType, string> = {
  historical_fact: 'a historical fact or event',
  interesting_discovery: 'an interesting discovery or finding',
  how_it_works: 'an explanation of how something works',
  comparison: 'a comparison between two related concepts or things',
  evolution: 'the evolution or development of something over time',
  curious_phenomenon: 'a curious or surprising phenomenon',
  practical_application: 'a practical application or real-world use case',
};

const PERSPECTIVE_DESCRIPTIONS: Record<ContentPerspective, string> = {
  causes: 'the causes and origins',
  effects: 'the effects and consequences',
  process: 'the process and methodology',
  comparison: 'comparisons and contrasts',
  evolution: 'evolution and changes over time',
  benefits: 'the benefits and advantages',
  challenges: 'the challenges and difficulties',
};

const UNIQUE_FOCUS_BY_CATEGORY: Record<CategoryId, string[]> = {
  technology: [
    'its impact on daily life',
    'how it changed communication',
    'its unexpected origins',
    'common misconceptions about it',
    'its environmental implications',
    'how it affects human behavior',
    'its role in solving global problems',
    'the pioneers who made it possible',
  ],
  history: [
    'the key figures involved',
    'the lasting impact on society',
    'lesser-known facts',
    'how it shaped the modern world',
    'the cultural context of the time',
    'what we can learn from it today',
    'the causes that led to it',
    'how different groups experienced it',
  ],
  education: [
    'research-backed strategies',
    'common mistakes to avoid',
    'how technology is changing it',
    'cultural differences in approach',
    'the psychology behind it',
    'practical tips for implementation',
    'historical development of methods',
    'future trends and innovations',
  ],
  programming: [
    'real-world applications',
    'common pitfalls and how to avoid them',
    'evolution of best practices',
    'performance considerations',
    'security implications',
    'how beginners can get started',
    'advanced techniques for experts',
    'industry standards and conventions',
  ],
  culture: [
    'historical origins and evolution',
    'regional variations',
    'influence on modern society',
    'famous examples and masterpieces',
    'the creative process behind it',
    'social and political context',
    'cross-cultural comparisons',
    'preservation and future challenges',
  ],
  pop_culture: [
    'behind-the-scenes secrets and fun facts',
    'the creative minds and studios behind it',
    'its cultural impact and global influence',
    'interesting trivia fans might not know',
    'how it revolutionized its genre',
    'memorable characters and why fans love them',
    'connections between different franchises',
    'the evolution from original to modern adaptations',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Public types + service
// ─────────────────────────────────────────────────────────────────────────────

export interface RandomPromptParams {
  category: CategoryId;
  difficulty: DifficultyLevel;
  size: TextSize;
  /** 1–2 subcategory names from the chosen category, picked by the caller
   * (typically the controller's `generateRandomParams` decides them). */
  subcategories: string[];
  /** e.g. "interesting_discovery" — which kind of angle for the text. */
  contentType: ContentType;
  /** e.g. "causes" — which lens to look through. */
  perspective: ContentPerspective;
  /** The unique hook the LLM will explore (e.g. "its impact on daily life"). */
  uniqueFocusElement: string;
}

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
  seed: string;
  params: RandomPromptParams;
}

function resolveCefrLevel(difficulty: DifficultyLevel): CefrLevel {
  const choices = CEFR_BY_DIFFICULTY[difficulty];
  const first = choices[0];
  if (!first) {
    throw new Error(`No CEFR levels mapped for difficulty "${difficulty}"`);
  }
  return first;
}

function pickRandom<T>(arr: readonly T[]): T {
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

function getCategoryConfig(id: CategoryId): CategoryConfig {
  const cfg = CATEGORIES.find((c) => c.id === id);
  if (!cfg) {
    throw new Error(`Unknown category "${id}"`);
  }
  return cfg;
}

@Injectable()
export class PromptGeneratorService {
  /**
   * Builds the full prompt that goes to the LLM.
   *
   * The userPrompt is the critical piece: it tells the LLM exactly which
   * vocabulary level and grammar structures to use (so a learner on
   * `easy` doesn't get a wall of C1 vocabulary), plus the word count range
   * (so a `short` reading is short and a `long` one is genuinely long).
   *
   * The systemPrompt sets the JSON output contract — the LLM MUST echo
   * the requested `difficulty` so the database stays in sync with what
   * the user asked for, even if the AI would have chosen otherwise.
   */
  buildPrompt(params: RandomPromptParams): GeneratedPrompt {
    return {
      systemPrompt: this.buildSystemPrompt(),
      userPrompt: this.buildUserPrompt(params),
      params,
      seed: this.generateSeed(params),
    };
  }

  /**
   * Generates a random-but-valid params object. Used as a fallback when
   * the request body is missing one or more categorical fields. The caller
   * should pass what the user provided and only fall back to this when
   * missing.
   */
  generateRandomParams(partial?: Partial<RandomPromptParams>): RandomPromptParams {
    const category = partial?.category ?? pickRandom(READING_CATEGORIES);
    const difficulty = partial?.difficulty ?? pickRandom(READING_DIFFICULTIES);
    const size = partial?.size ?? pickRandom(READING_TEXT_SIZES);
    const categoryConfig = getCategoryConfig(category);
    const subcategories = (partial?.subcategories ?? []).length
      ? (partial?.subcategories ?? [])
      : [pickRandom(categoryConfig.subcategories).name];

    return {
      category,
      difficulty,
      size,
      subcategories,
      contentType:
        partial?.contentType ?? pickRandom(Object.keys(CONTENT_TYPE_DESCRIPTIONS) as ContentType[]),
      perspective:
        partial?.perspective ??
        pickRandom(Object.keys(PERSPECTIVE_DESCRIPTIONS) as ContentPerspective[]),
      uniqueFocusElement:
        partial?.uniqueFocusElement ?? pickRandom(UNIQUE_FOCUS_BY_CATEGORY[category]),
    };
  }

  /**
   * Returns the cefrLevel that should be persisted alongside the reading.
   * The public DTO no longer exposes this — the service pins the level
   * here so the user can't pick an inconsistent pairing.
   */
  resolveCefrLevelFor(difficulty: DifficultyLevel): CefrLevel {
    return resolveCefrLevel(difficulty);
  }

  /** Returns the static categories config (used by /readings/options). */
  getAvailableCategories(): CategoryConfig[] {
    return CATEGORIES;
  }

  /** Returns the static sizes config (used by /readings/options). */
  getAvailableSizes(): TextSizeConfig[] {
    return Object.values(TEXT_SIZES);
  }

  /**
   * Builds the JSON-only system prompt that locks down the output format
   * and tells the LLM what kind of content is unacceptable (stories,
   * characters, first-person voice).
   */
  private buildSystemPrompt(): string {
    return `
You are an English content generator for language learners.
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
  "category": "${READING_CATEGORIES.join(' | ')}",
  "difficulty": "easy | medium | hard"
}

No additional text, no markdown, no explanations. ONLY the JSON object.
    `.trim();
  }

  /**
   * The user prompt that drives the LLM's writing style. This is the
   * part that changed in this commit: instead of a flat "easy reading
   * about Technology", it now injects explicit vocabulary and grammar
   * guidelines that match the chosen difficulty and a word count range
   * that matches the chosen size.
   */
  private buildUserPrompt(params: RandomPromptParams): string {
    const categoryConfig = getCategoryConfig(params.category);
    const difficulty = DIFFICULTY_LEVELS[params.difficulty];
    const textSize = TEXT_SIZES[params.size];
    const contentTypeDesc = CONTENT_TYPE_DESCRIPTIONS[params.contentType];
    const perspectiveDesc = PERSPECTIVE_DESCRIPTIONS[params.perspective];

    return `
Generate a reading text in English with the following specific constraints:

TOPIC REQUIREMENTS:
- Primary topic: ${categoryConfig.name}, focusing on ${params.subcategories.join(' and ')}
- Content type: Write about ${contentTypeDesc}
- Perspective: Focus on ${perspectiveDesc}
- Unique angle: Explore ${params.uniqueFocusElement}

TEXT SPECIFICATIONS:
- Length: ${textSize.min}-${textSize.max} words (${textSize.label} length)
- Approximate reading time: ${textSize.readingTime}
- Style: Informative and explanatory, like a short article
- Tone: Neutral and engaging

LANGUAGE LEVEL REQUIREMENTS (CRITICAL - THIS IS THE DIFFICULTY):
- Target level: ${difficulty.description}
- The output "difficulty" field MUST be "${difficulty.id}"
- VOCABULARY: ${difficulty.vocabularyGuidelines}
- GRAMMAR: ${difficulty.grammarGuidelines}

STRICT RULES:
- Do NOT tell a story or create characters
- Do NOT use personal names or experiences
- Do NOT write in first-person narrative
- Do NOT use bullet points or numbered lists in the content
- Output ONLY the JSON object as specified
    `.trim();
  }

  private generateSeed(params: RandomPromptParams): string {
    const parts: string[] = [];
    parts.push(params.category.slice(0, 4));
    parts.push(params.size.slice(0, 3));
    parts.push(params.difficulty.slice(0, 3));
    parts.push(params.contentType.split('_')[0].slice(0, 4));
    parts.push(Date.now().toString());
    parts.push(`${Math.floor(Math.random() * 1e6)}`);
    return parts.join('_');
  }
}
