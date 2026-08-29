import { PromptGeneratorService, type RandomPromptParams } from './prompt-generator.service';

describe('PromptGeneratorService', () => {
  let service: PromptGeneratorService;

  beforeEach(() => {
    service = new PromptGeneratorService();
  });

  describe('buildPrompt', () => {
    it('produces a system prompt that requests JSON only', () => {
      const { systemPrompt } = service.buildPrompt({
        category: 'history',
        difficulty: 'medium',
        cefrLevel: 'B2',
      });
      expect(systemPrompt).toContain('JSON');
      expect(systemPrompt).toContain('title');
      expect(systemPrompt).toContain('content');
    });

    it('produces a user prompt that includes the category label', () => {
      const { userPrompt } = service.buildPrompt({
        category: 'technology',
        difficulty: 'easy',
        cefrLevel: 'A2',
      });
      expect(userPrompt).toContain('Technology');
      expect(userPrompt).toContain('easy');
      expect(userPrompt).toContain('A2');
    });

    it('emits a unique seed each call', () => {
      const a = service.buildPrompt({ category: 'history', difficulty: 'medium', cefrLevel: 'B2' });
      const b = service.buildPrompt({ category: 'history', difficulty: 'medium', cefrLevel: 'B2' });
      expect(a.seed).not.toBe(b.seed);
    });

    it('returns the params it was given (round-trip)', () => {
      const params: RandomPromptParams = { category: 'culture', difficulty: 'hard', cefrLevel: 'C1' };
      const result = service.buildPrompt(params);
      expect(result.params).toEqual(params);
    });
  });

  describe('generateRandomParams', () => {
    it('returns a valid params object', () => {
      const params = service.generateRandomParams();
      expect(['technology', 'history', 'education', 'programming', 'culture', 'pop_culture']).toContain(
        params.category,
      );
      expect(['easy', 'medium', 'hard']).toContain(params.difficulty);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(params.cefrLevel);
    });
  });
});
