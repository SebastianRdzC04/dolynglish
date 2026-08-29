import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users, authAccessTokens, readings, promptLogs } from './schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type AccessToken = InferSelectModel<typeof authAccessTokens>;
export type NewAccessToken = InferInsertModel<typeof authAccessTokens>;

export type Reading = InferSelectModel<typeof readings>;
export type NewReading = InferInsertModel<typeof readings>;

export type PromptLog = InferSelectModel<typeof promptLogs>;
export type NewPromptLog = InferInsertModel<typeof promptLogs>;
