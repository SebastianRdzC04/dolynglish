import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateReadingDto {
  @ApiProperty({
    required: false,
    description: 'Optional seed to bias the random prompt generator (not yet used by the LLM)',
  })
  @IsOptional()
  @IsString()
  seed?: string;
}

export class EvaluateReadingDto {
  @ApiProperty({
    minLength: 20,
    description: 'The user’s summary of the reading. Must be at least 20 chars.',
    example: 'The reading was about the Industrial Revolution and how steam engines changed manufacturing.',
  })
  @IsString()
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