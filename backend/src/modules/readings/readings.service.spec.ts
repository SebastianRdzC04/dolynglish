import { Test } from '@nestjs/testing';
import { AppHttpException } from '../../common/errors/app-http.exception';
import { ReadingsService } from './readings.service';
import { AIProviderFactory } from '../ia/providers/ai-provider.factory';
import { PromptGeneratorService, type RandomPromptParams } from './prompt-generator.service';
import { AiResponseParserService } from './ai-response-parser.service';
import { PromptLogService } from './prompt-log.service';
import { UsersService } from '../users/users.service';
import { DRIZZLE } from '../../database/database.tokens';
import type { DrizzleDb } from '../../database/database.module';

describe('ReadingsService', () => {
  let service: ReadingsService;
  let factory: jest.Mocked<Pick<AIProviderFactory, 'getFullResponse'>>;
  let promptGen: jest.Mocked<Pick<PromptGeneratorService, 'buildPrompt' | 'generateRandomParams'>>;
  let parser: jest.Mocked<Pick<AiResponseParserService, 'parseGeneratedText' | 'parseEvaluation'>>;
  let logs: jest.Mocked<Pick<PromptLogService, 'logAuthEvent' | 'logPromptSuccess' | 'logPromptError'>>;
  let users: jest.Mocked<Pick<UsersService, 'findById'>>;
  let db: { insert: jest.Mock; select: jest.Mock; update: jest.Mock; delete: jest.Mock };

  const buildModuleWithDb = async (dbMock: typeof db): Promise<ReadingsService> => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingsService,
        { provide: AIProviderFactory, useValue: factory },
        { provide: PromptGeneratorService, useValue: promptGen },
        { provide: AiResponseParserService, useValue: parser },
        { provide: PromptLogService, useValue: logs },
        { provide: UsersService, useValue: users },
        { provide: DRIZZLE, useValue: dbMock as unknown as DrizzleDb },
      ],
    }).compile();
    return moduleRef.get(ReadingsService);
  };

  beforeEach(() => {
    factory = { getFullResponse: jest.fn() } as never;
    promptGen = {
      buildPrompt: jest.fn(),
      generateRandomParams: jest.fn(),
    } as never;
    parser = {
      parseGeneratedText: jest.fn(),
      parseEvaluation: jest.fn(),
    } as never;
    logs = { logAuthEvent: jest.fn(), logPromptSuccess: jest.fn(), logPromptError: jest.fn() } as never;
    users = { findById: jest.fn().mockResolvedValue({ id: 42, email: 'a@b.c', fullName: 'A B', currentStreak: 0, lastStreakDate: null, createdAt: new Date(), updatedAt: null, deletedAt: null, password: 'hash' }) } as never;

    const insertedReading = {
      id: 1, userId: 42, status: 'pending', title: 'X', description: 'X', content: 'X',
      category: 'technology' as const, difficulty: 'easy' as const, wordCount: 100,
      score: null, passed: null,
      createdAt: new Date(), updatedAt: null, deletedAt: null,
    };
    const insertChain = { values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([insertedReading]) }) };
    db = {
      insert: jest.fn().mockReturnValue(insertChain),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([insertedReading]),
            orderBy: jest.fn().mockResolvedValue([insertedReading]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ ...insertedReading, status: 'completed' }]) }) }) }),
      delete: jest.fn(),
    };
  });

  describe('generate', () => {
    const makeDbReturning = (returned: Record<string, unknown>): { insert: jest.Mock; select: jest.Mock; update: jest.Mock; delete: jest.Mock } => {
      const insertChain = {
        values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([returned]) }),
      };
      return {
        insert: jest.fn().mockReturnValue(insertChain),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([returned]),
              orderBy: jest.fn().mockResolvedValue([returned]),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ ...returned, status: 'completed' }]) }) }),
        }),
        delete: jest.fn(),
      };
    };

    it('calls the AI provider, parses the response, and saves the reading', async () => {
      const params: RandomPromptParams = {
        category: 'history',
        difficulty: 'medium',
        size: 'medium',
        subcategories: ['Subcategory test'],
        contentType: 'interesting_discovery',
        perspective: 'causes',
        uniqueFocusElement: 'its impact on daily life',
      };
      promptGen.generateRandomParams.mockReturnValue(params);
      promptGen.buildPrompt.mockReturnValue({
        systemPrompt: 'sys', userPrompt: 'usr', seed: 'seed-1', params,
      });
      factory.getFullResponse.mockResolvedValue('{"title":"T","description":"D","content":"C","category":"history","difficulty":"medium"}');
      const returned = {
        id: 1, userId: 42, status: 'pending',
        title: 'T', description: 'D', content: 'C', category: 'history' as const, difficulty: 'medium' as const,
        wordCount: 1, score: null, passed: null,
        createdAt: new Date(), updatedAt: null, deletedAt: null,
      };
      parser.parseGeneratedText.mockReturnValue(returned);
      const localDb = makeDbReturning(returned);
      service = await buildModuleWithDb(localDb);

      const result = await service.generate({
        userId: 42,
        options: { category: 'history', difficulty: 'medium', size: 'medium' },
      });

      expect(promptGen.generateRandomParams).toHaveBeenCalledWith({
        category: 'history',
        difficulty: 'medium',
        size: 'medium',
      });
      expect(promptGen.buildPrompt).toHaveBeenCalledWith(params);
      expect(factory.getFullResponse).toHaveBeenCalled();
      expect(parser.parseGeneratedText).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.title).toBe('T');
    });

    it('passes the client-controlled category/difficulty/size to the prompt generator verbatim', async () => {
      const params: RandomPromptParams = {
        category: 'programming',
        difficulty: 'hard',
        size: 'medium',
        subcategories: ['Subcategory test'],
        contentType: 'interesting_discovery',
        perspective: 'causes',
        uniqueFocusElement: 'its impact on daily life',
      };
      promptGen.generateRandomParams.mockReturnValue(params);
      promptGen.buildPrompt.mockReturnValue({
        systemPrompt: 'sys',
        userPrompt: 'usr',
        seed: 'seed-2',
        params,
      });
      factory.getFullResponse.mockResolvedValue(
        '{"title":"T","description":"D","content":"C","category":"programming","difficulty":"hard"}',
      );
      const returned = {
        id: 2, userId: 42, status: 'pending',
        title: 'T', description: 'D', content: 'C', category: 'programming' as const, difficulty: 'hard' as const,
        wordCount: 1, score: null, passed: null,
        createdAt: new Date(), updatedAt: null, deletedAt: null,
      };
      parser.parseGeneratedText.mockReturnValue(returned);
      const localDb = makeDbReturning(returned);
      service = await buildModuleWithDb(localDb);

      await service.generate({
        userId: 42,
        options: { category: 'programming', difficulty: 'hard', size: 'medium' },
      });

      // buildPrompt receives the user-chosen category/difficulty/size inside
      // the params bag (the system fills in subcategories/contentType/etc.).
      expect(promptGen.buildPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'programming',
          difficulty: 'hard',
          size: 'medium',
        }),
      );
    });

    it('defaults difficulty to medium and size to medium when only category is given', async () => {
      const params: RandomPromptParams = {
        category: 'culture',
        difficulty: 'medium',
        size: 'medium',
        subcategories: ['Subcategory test'],
        contentType: 'interesting_discovery',
        perspective: 'causes',
        uniqueFocusElement: 'its impact on daily life',
      };
      promptGen.generateRandomParams.mockReturnValue(params);
      promptGen.buildPrompt.mockReturnValue({
        systemPrompt: 'sys',
        userPrompt: 'usr',
        seed: 'seed-3',
        params,
      });
      factory.getFullResponse.mockResolvedValue(
        '{"title":"T","description":"D","content":"C","category":"culture","difficulty":"medium"}',
      );
      const returned = {
        id: 3, userId: 42, status: 'pending',
        title: 'T', description: 'D', content: 'C', category: 'culture' as const, difficulty: 'medium' as const,
        wordCount: 1, score: null, passed: null,
        createdAt: new Date(), updatedAt: null, deletedAt: null,
      };
      parser.parseGeneratedText.mockReturnValue(returned);
      const localDb = makeDbReturning(returned);
      service = await buildModuleWithDb(localDb);

      await service.generate({ userId: 42, options: { category: 'culture' } });

      expect(promptGen.buildPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'culture',
          difficulty: 'medium',
          size: 'medium',
        }),
      );
    });

    it('throws BadRequestException if AI returns no usable JSON', async () => {
      promptGen.buildPrompt.mockReturnValue({
        systemPrompt: 'sys', userPrompt: 'usr', seed: 's', params: {
          category: 'history', difficulty: 'medium', size: 'medium',
          subcategories: ['Subcategory test'], contentType: 'interesting_discovery',
          perspective: 'causes', uniqueFocusElement: 'its impact on daily life',
        },
      });
      factory.getFullResponse.mockResolvedValue('no json here');
      parser.parseGeneratedText.mockImplementation(() => {
        throw new Error('No JSON object found in response');
      });
      service = await buildModuleWithDb(db);
      await expect(
        service.generate({ userId: 42, options: { category: 'history', difficulty: 'medium' } }),
      ).rejects.toBeInstanceOf(AppHttpException);
    });
  });

  describe('findById', () => {
    it('returns the reading if it exists and belongs to the user', async () => {
      service = await buildModuleWithDb(db);
      const result = await service.findById(1, 42);
      expect(result.id).toBe(1);
      expect(result.userId).toBe(42);
    });

    it('throws NotFoundException if reading belongs to a different user', async () => {
      const otherUserReading = { id: 1, userId: 99, status: 'pending', title: 'X', description: 'X', content: 'X', category: 'technology' as const, difficulty: 'easy' as const, wordCount: 100, score: null, passed: null, createdAt: new Date(), updatedAt: null, deletedAt: null };
      const dbOther = {
        ...db,
        select: jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([otherUserReading]) }) }) }),
      };
      service = await buildModuleWithDb(dbOther);
      await expect(service.findById(1, 42)).rejects.toBeInstanceOf(AppHttpException);
    });
  });

  describe('evaluate', () => {
    it('saves the score and marks the reading as completed', async () => {
      parser.parseEvaluation.mockReturnValue({ score: 85, passed: true, feedback: 'Good' });
      service = await buildModuleWithDb(db);
      const result = await service.evaluate(1, 42, { userResponse: 'I understood the text well' });
      expect(result.score).toBe(85);
      expect(result.passed).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
