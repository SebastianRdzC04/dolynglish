import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AIProviderFactory } from '../ia/providers/ai-provider.factory';
import { PromptGeneratorService, type RandomPromptParams } from './prompt-generator.service';
import { AiResponseParserService, type GeneratedText, type EvaluationResult } from './ai-response-parser.service';
import { PromptLogService } from './prompt-log.service';
import { UsersService } from '../users/users.service';
import { DRIZZLE } from '../../database/database.tokens';
import type { DrizzleDb } from '../../database/database.module';
import { readings } from '../../database/drizzle/schema';
import type { Reading, NewReading } from '../../database/drizzle/types';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { GenerateReadingDto, EvaluateReadingDto } from './dto/readings.dto';

const MAX_PENDING = 3;

@Injectable()
export class ReadingsService {
  constructor(
    private readonly factory: AIProviderFactory,
    private readonly promptGen: PromptGeneratorService,
    private readonly parser: AiResponseParserService,
    private readonly promptLogs: PromptLogService,
    private readonly users: UsersService,
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
  ) {}

  async generate(input: { userId: number; options?: GenerateReadingDto }): Promise<Reading> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pendingCount = await this.getPendingCount(input.userId);
    if (pendingCount >= MAX_PENDING) {
      throw new BadRequestException(
        `You have reached the maximum of ${MAX_PENDING} pending readings. Complete some before generating more.`,
      );
    }

    const params: RandomPromptParams = input.options?.seed
      ? { category: 'history', difficulty: 'medium', cefrLevel: 'B2' }
      : this.promptGen.generateRandomParams();
    const prompt = this.promptGen.buildPrompt(params);

    let rawResponse: string;
    try {
      rawResponse = await this.factory.getFullResponse([
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt },
      ]);
    } catch (err) {
      throw new BadRequestException(`AI provider failed: ${(err as Error).message}`);
    }

    let parsed: GeneratedText;
    try {
      parsed = this.parser.parseGeneratedText(rawResponse);
    } catch (err) {
      await this.promptLogs.logPromptError('text_generation_failed', input.userId, (err as Error).message, prompt.seed);
      throw new BadRequestException('Failed to parse AI response for text generation');
    }

    const wordCount = parsed.content.trim().split(/\s+/).filter(Boolean).length;
    const row: NewReading = {
      userId: input.userId,
      title: parsed.title,
      description: parsed.description,
      content: parsed.content,
      category: parsed.category,
      difficulty: parsed.difficulty,
      wordCount,
      status: 'pending',
      createdAt: new Date(),
    };

    const [inserted] = await this.db.insert(readings).values(row).returning();
    if (!inserted) {
      throw new Error('Insert returned no rows');
    }
    await this.promptLogs.logPromptSuccess('text_generated', input.userId, inserted.id, prompt.seed, { ...params });
    return inserted;
  }

  async findById(id: number, userId: number): Promise<Reading> {
    const rows = await this.db
      .select()
      .from(readings)
      .where(and(eq(readings.id, id), isNull(readings.deletedAt)))
      .limit(1);
    const reading = rows[0];
    if (!reading || reading.userId !== userId) {
      throw new NotFoundException('Reading not found');
    }
    return reading;
  }

  async listPending(userId: number): Promise<Reading[]> {
    return this.db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.userId, userId),
          eq(readings.status, 'pending'),
          isNull(readings.deletedAt),
        ),
      )
      .orderBy(desc(readings.createdAt));
  }

  async listCompleted(userId: number): Promise<Reading[]> {
    return this.db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.userId, userId),
          eq(readings.status, 'completed'),
          isNull(readings.deletedAt),
        ),
      )
      .orderBy(desc(readings.createdAt));
  }

  async getOptions(): Promise<{
    categories: string[];
    difficulties: string[];
    cefrLevels: string[];
  }> {
    return {
      categories: ['technology', 'history', 'education', 'programming', 'culture', 'pop_culture'],
      difficulties: ['easy', 'medium', 'hard'],
      cefrLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    };
  }

  async evaluate(id: number, userId: number, dto: EvaluateReadingDto): Promise<EvaluationResult & { reading: Reading }> {
    const reading = await this.findById(id, userId);
    if (reading.status !== 'pending') {
      throw new BadRequestException('Reading has already been evaluated');
    }

    const systemPrompt = `You are an English comprehension evaluator for language learners.
Your task is to evaluate if the user correctly understood the main idea of a given text.
You must respond ONLY with a JSON object in this exact format: {"score": <number>, "passed": <boolean>, "feedback": "<string>"}
- "score" is a number from 0 to 100 representing how well the user understood the text
- "passed" is true if score >= 80, false otherwise
- "feedback" is a brief (1-2 sentences) explanation of the evaluation
Do not include any other text, explanation, or formatting. Only the JSON object.`;

    const userPrompt = `Here is the original text the user read:
"""
Title: ${reading.title}

${reading.content}
"""

Here is the user's summary of the text:
"""
${dto.userResponse}
"""

Evaluate how well the user understood the main idea of the text.`;

    const raw = await this.factory.getFullResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const result = this.parser.parseEvaluation(raw);
    const [updated] = await this.db
      .update(readings)
      .set({
        score: result.score,
        passed: result.passed,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(readings.id, id))
      .returning();

    if (!updated) {
      throw new Error('Update returned no rows');
    }
    return { ...result, reading: updated };
  }

  async explain(
    id: number,
    userId: number,
    word: string,
    context?: string,
  ): Promise<{ explanation: string; reading: Reading }> {
    const reading = await this.findById(id, userId);

    const systemPrompt = `You are an English vocabulary explainer for language learners.
Given a word (and optionally its context in a sentence), respond ONLY with a JSON object:
{"explanation": "<string>"}
The explanation should be 1-2 sentences, simple enough for a B1-B2 learner.`;

    const userPrompt = context
      ? `Explain the word "${word}" as used in this context: "${context}".`
      : `Explain the English word "${word}" in simple terms.`;

    const raw = await this.factory.getFullResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let explanation: string;
    try {
      const parsed = JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()) as { explanation?: string };
      explanation = String(parsed.explanation ?? raw.trim());
    } catch {
      explanation = raw.trim();
    }
    return { explanation, reading };
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findById(id, userId);
    await this.db
      .update(readings)
      .set({ deletedAt: new Date() })
      .where(and(eq(readings.id, id), eq(readings.userId, userId)));
  }

  private async getPendingCount(userId: number): Promise<number> {
    const pending = await this.listPending(userId);
    return pending.length;
  }
}
