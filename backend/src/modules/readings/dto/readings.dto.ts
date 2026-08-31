import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  CEFR_BY_DIFFICULTY,
  type CategoryId,
  type CefrLevel,
  type DifficultyLevel,
} from '../prompt-generator.service';

export const READING_CATEGORIES: readonly CategoryId[] = [
  'technology',
  'history',
  'education',
  'programming',
  'culture',
  'pop_culture',
] as const;

export const READING_DIFFICULTIES: readonly DifficultyLevel[] = ['easy', 'medium', 'hard'] as const;

export const READING_CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

/**
 * Default CEFR levels for each difficulty, exported here so the OpenAPI
 * examples stay aligned with the runtime choices the prompt generator
 * actually picks when the client omits `cefrLevel`.
 */
function defaultCefrFor(difficulty: DifficultyLevel): CefrLevel {
  return CEFR_BY_DIFFICULTY[difficulty][0];
}

/**
 * Returns the CefrLevel that should be used to bias the prompt generator.
 * Picks the explicit `cefrLevel` from the DTO when present AND compatible
 * with the chosen `difficulty`; falls back to the default CEFR level for
 * the chosen `difficulty` when one wasn't sent or when the explicit pair
 * isn't compatible.
 */
export function resolveCefrLevel(input: {
  difficulty?: DifficultyLevel;
  cefrLevel?: CefrLevel;
}): CefrLevel {
  const difficulty: DifficultyLevel = input.difficulty ?? 'medium';
  if (input.cefrLevel) {
    const allowed = CEFR_BY_DIFFICULTY[difficulty];
    if (allowed.includes(input.cefrLevel)) {
      return input.cefrLevel;
    }
  }
  return defaultCefrFor(difficulty);
}

export class GenerateReadingDto {
  @ApiProperty({
    description:
      'Topic for the generated reading. The LLM is biased to write about this category but may pick a sub-topic on its own. **Required**.',
    enum: READING_CATEGORIES,
    example: 'technology',
  })
  @IsString()
  @IsIn(READING_CATEGORIES as readonly string[])
  category!: CategoryId;

  @ApiProperty({
    description:
      'Difficulty controls word count (easy: 100–150, medium: 180–260, hard: 280–380) and the target CEFR level. Defaults to `medium`.',
    enum: READING_DIFFICULTIES,
    default: 'medium',
    example: 'medium',
    required: false,
  })
  @IsOptional()
  @IsIn(READING_DIFFICULTIES as readonly string[])
  difficulty?: DifficultyLevel;

  @ApiProperty({
    description:
      'Explicit CEFR level (A1–C2). If omitted, the backend picks the default for the chosen `difficulty`. `easy` → A2/B1, `medium` → B2, `hard` → C1/C2.',
    enum: READING_CEFR_LEVELS,
    example: 'B2',
    required: false,
  })
  @IsOptional()
  @IsIn(READING_CEFR_LEVELS as readonly string[])
  cefrLevel?: CefrLevel;

  /**
   * Default CEFR levels for each difficulty. Exported so the OpenAPI
   * examples stay aligned with the runtime choices the prompt generator
   * makes when the client omits `cefrLevel`.
   */
  static defaultCefrForDifficulty(difficulty: DifficultyLevel): CefrLevel {
    return CEFR_BY_DIFFICULTY[difficulty][0];
  }
}

export class EvaluateReadingDto {
  @ApiProperty({
    minLength: 20,
    description: 'The user’s summary of the reading. Must be at least 20 chars.',
    example: 'The reading was about the Industrial Revolution and how steam engines changed manufacturing.',
  })
  @IsString()
  @Length(20)
  userResponse!: string;
}

export class CreateExplanationDto {
  @ApiProperty({ description: 'Word to explain', example: 'ubiquitous' })
  @IsString()
  word!: string;

  @ApiProperty({
    required: false,
    description: 'Optional sentence where the word appears, for disambiguation',
    example: 'Smartphones have become ubiquitous in modern life.',
  })
  @IsOptional()
  @IsString()
  context?: string;
}