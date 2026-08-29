import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.tokens';
import { Inject as InjectAlias } from '@nestjs/common';
import type { DrizzleDb } from '../../database/database.module';
import { promptLogs } from '../../database/drizzle/schema';
import type { NewPromptLog } from '../../database/drizzle/types';
import { eq, and, isNull, desc } from 'drizzle-orm';

export type AuthEvent = 'user_registered' | 'user_login' | 'user_logout';
export type PromptEvent =
  | 'text_generated'
  | 'text_generation_failed'
  | 'reading_evaluated'
  | 'word_explained';

@Injectable()
export class PromptLogService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async logAuthEvent(event: AuthEvent, _userId: number): Promise<void> {
    const row: NewPromptLog = {
      level: 'info',
      event,
      message: `auth event: ${event}`,
    };
    await this.db.insert(promptLogs).values(row);
  }

  async logPromptSuccess(
    event: PromptEvent,
    userId: number,
    textId: number,
    seed: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    const row: NewPromptLog = {
      level: 'info',
      event,
      message: `prompt success: ${event}`,
      userId,
      textId,
      seed,
      params,
    };
    await this.db.insert(promptLogs).values(row);
  }

  async logPromptError(
    event: PromptEvent,
    userId: number | null,
    error: string,
    seed: string,
  ): Promise<void> {
    const row: NewPromptLog = {
      level: 'error',
      event,
      message: `prompt error: ${event}: ${error}`,
      userId,
      seed,
      errorMessage: error,
    };
    await this.db.insert(promptLogs).values(row);
  }

  async recentFailedAttempts(userId: number, limit = 5): Promise<Array<{ id: number; message: string | null }>> {
    const rows = await this.db
      .select({ id: promptLogs.id, message: promptLogs.message })
      .from(promptLogs)
      .where(and(eq(promptLogs.userId, userId), eq(promptLogs.level, 'error'), isNull(promptLogs.errorMessage)))
      .orderBy(desc(promptLogs.createdAt))
      .limit(limit);
    return rows;
  }
}

// Silence "Inject imported twice" if it ever fires — kept for tree-shaking.
void InjectAlias;
