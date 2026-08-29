import { IsOptional, IsString } from 'class-validator';

export type TextCategory = 'technology' | 'history' | 'education' | 'programming' | 'culture' | 'pop_culture';
export type TextDifficulty = 'easy' | 'medium' | 'hard';

export class GenerateReadingDto {
  @IsOptional()
  @IsString()
  seed?: string;
}

export class EvaluateReadingDto {
  @IsString()
  userResponse!: string;
}

export class CreateExplanationDto {
  @IsString()
  word!: string;

  @IsOptional()
  @IsString()
  context?: string;
}
