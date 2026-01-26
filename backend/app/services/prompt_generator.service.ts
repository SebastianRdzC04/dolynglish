import { inject } from '@adonisjs/core'
import PromptLogService from './prompt_log.service.js'
import type { TextCategory } from '../types/api_response.js'
import type {
  TextSize,
  TextSizeConfig,
  TimePeriod,
  CategoryConfig,
  ContentType,
  ContentPerspective,
  GeographicRegion,
  RandomPromptParams,
  GenerateTextOptions,
  GeneratedPrompt,
  GenerationOptionsResponse,
  DifficultyLevel,
  DifficultyConfig,
} from '../types/prompt_generator.js'

@inject()
export default class PromptGeneratorService {
  constructor(private logService: PromptLogService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN ESTÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  private static readonly TEXT_SIZES: Record<TextSize, TextSizeConfig> = {
    short: { min: 80, max: 120, label: 'short', readingTime: '~1 min' },
    medium: { min: 150, max: 220, label: 'medium', readingTime: '~2 min' },
    long: { min: 250, max: 350, label: 'long', readingTime: '~3 min' },
  }

  /**
   * Configuración de niveles de dificultad mapeados a CEFR
   * - easy: A1-A2 (Beginner/Elementary)
   * - medium: B1-B2 (Intermediate/Upper-Intermediate)
   * - hard: C1-C2 (Advanced/Proficiency)
   */
  private static readonly DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyConfig> = {
    easy: {
      id: 'easy',
      label: 'Beginner',
      cefrLevels: ['A1', 'A2'],
      description: 'A1-A2 level (Beginner to Elementary)',
      vocabularyGuidelines: 'Use only basic, everyday vocabulary (around 500-1000 most common words). Avoid idioms, phrasal verbs, and technical terms.',
      grammarGuidelines: 'Use simple present, simple past, and simple future. Short sentences (8-12 words). Avoid complex structures like conditionals, passive voice, or relative clauses.',
    },
    medium: {
      id: 'medium',
      label: 'Intermediate',
      cefrLevels: ['B1', 'B2'],
      description: 'B1-B2 level (Intermediate to Upper-Intermediate)',
      vocabularyGuidelines: 'Use intermediate vocabulary with some less common words. Include common idioms and phrasal verbs. Topic-specific vocabulary is acceptable with context.',
      grammarGuidelines: 'Use a variety of tenses including perfect tenses and conditionals. Medium-length sentences (12-20 words). Can include passive voice and relative clauses.',
    },
    hard: {
      id: 'hard',
      label: 'Advanced',
      cefrLevels: ['C1', 'C2'],
      description: 'C1-C2 level (Advanced to Proficiency)',
      vocabularyGuidelines: 'Use sophisticated vocabulary including academic and specialized terms. Include idiomatic expressions, collocations, and nuanced word choices.',
      grammarGuidelines: 'Use complex grammatical structures freely: mixed conditionals, subjunctive, cleft sentences, inversion. Longer, compound-complex sentences are encouraged.',
    },
  }

  private static readonly CATEGORIES: CategoryConfig[] = [
    {
      id: 'technology',
      name: 'Technology',
      supportsTimePeriod: true,
      subcategories: [
        { id: 'smartphones', name: 'Smartphones and Mobile Technology', keywords: ['mobile', 'apps', 'connectivity'] },
        { id: 'ai', name: 'Artificial Intelligence', keywords: ['machine learning', 'automation', 'algorithms'] },
        { id: 'cybersecurity', name: 'Cybersecurity', keywords: ['privacy', 'hacking', 'protection'] },
        { id: 'social_media', name: 'Social Media', keywords: ['platforms', 'communication', 'networks'] },
        { id: 'robotics', name: 'Robotics', keywords: ['automation', 'machines', 'manufacturing'] },
        { id: 'cloud', name: 'Cloud Computing', keywords: ['servers', 'storage', 'services'] },
        { id: 'iot', name: 'Internet of Things', keywords: ['sensors', 'smart devices', 'connectivity'] },
        { id: 'vr_ar', name: 'Virtual and Augmented Reality', keywords: ['immersive', 'simulation', '3D'] },
      ],
    },
    {
      id: 'history',
      name: 'History',
      supportsTimePeriod: true,
      subcategories: [
        { id: 'ancient', name: 'Ancient Civilizations', keywords: ['empires', 'cultures', 'archaeology'] },
        { id: 'medieval', name: 'Medieval Period', keywords: ['kingdoms', 'feudalism', 'castles'] },
        { id: 'wars', name: 'Wars and Conflicts', keywords: ['battles', 'military', 'treaties'] },
        { id: 'industrial', name: 'Industrial Revolution', keywords: ['factories', 'inventions', 'urbanization'] },
        { id: 'cultural', name: 'Cultural Movements', keywords: ['art', 'philosophy', 'social change'] },
        { id: 'inventions', name: 'Famous Inventions', keywords: ['innovation', 'discovery', 'progress'] },
        { id: 'exploration', name: 'Exploration and Discovery', keywords: ['voyages', 'navigation', 'colonization'] },
      ],
    },
    {
      id: 'education',
      name: 'Education',
      supportsTimePeriod: false,
      subcategories: [
        { id: 'learning', name: 'Learning Methods', keywords: ['techniques', 'strategies', 'retention'] },
        { id: 'online', name: 'Online Education', keywords: ['e-learning', 'platforms', 'remote'] },
        { id: 'study', name: 'Study Techniques', keywords: ['memory', 'focus', 'habits'] },
        { id: 'psychology', name: 'Educational Psychology', keywords: ['motivation', 'development', 'cognition'] },
        { id: 'languages', name: 'Language Learning', keywords: ['acquisition', 'bilingualism', 'immersion'] },
        { id: 'skills', name: 'Skills Development', keywords: ['practice', 'mastery', 'competence'] },
      ],
    },
    {
      id: 'programming',
      name: 'Programming',
      supportsTimePeriod: true,
      defaultTimePeriod: 'modern_computing',
      subcategories: [
        { id: 'web', name: 'Web Development', keywords: ['websites', 'frontend', 'backend'] },
        { id: 'databases', name: 'Databases', keywords: ['SQL', 'storage', 'queries'] },
        { id: 'algorithms', name: 'Algorithms', keywords: ['sorting', 'searching', 'optimization'] },
        { id: 'software', name: 'Software Engineering', keywords: ['design', 'architecture', 'testing'] },
        { id: 'mobile', name: 'Mobile Development', keywords: ['apps', 'iOS', 'Android'] },
        { id: 'devops', name: 'DevOps', keywords: ['deployment', 'automation', 'infrastructure'] },
        { id: 'security', name: 'Software Security', keywords: ['vulnerabilities', 'encryption', 'authentication'] },
      ],
    },
    {
      id: 'culture',
      name: 'Culture',
      supportsTimePeriod: true,
      subcategories: [
        { id: 'music', name: 'Music', keywords: ['genres', 'instruments', 'composers'] },
        { id: 'art', name: 'Visual Arts', keywords: ['painting', 'sculpture', 'movements'] },
        { id: 'literature', name: 'Literature', keywords: ['novels', 'poetry', 'authors'] },
        { id: 'traditions', name: 'Traditions and Customs', keywords: ['festivals', 'rituals', 'heritage'] },
        { id: 'cinema', name: 'Cinema', keywords: ['films', 'directors', 'genres'] },
        { id: 'gastronomy', name: 'Gastronomy', keywords: ['cuisine', 'recipes', 'ingredients'] },
        { id: 'architecture', name: 'Architecture', keywords: ['buildings', 'styles', 'design'] },
      ],
    },
    {
      id: 'pop_culture',
      name: 'Pop Culture',
      supportsTimePeriod: true,
      subcategories: [
        { id: 'anime_manga', name: 'Anime and Manga', keywords: ['shonen', 'studio ghibli', 'naruto', 'one piece', 'attack on titan', 'dragon ball'] },
        { id: 'disney', name: 'Disney', keywords: ['animated films', 'pixar', 'princesses', 'theme parks', 'classics'] },
        { id: 'marvel', name: 'Marvel Universe', keywords: ['superheroes', 'avengers', 'comics', 'MCU', 'spider-man'] },
        { id: 'dc', name: 'DC Universe', keywords: ['batman', 'superman', 'justice league', 'comics', 'dceu'] },
        { id: 'pixar', name: 'Pixar Animation', keywords: ['toy story', 'finding nemo', 'inside out', 'animation technology'] },
        { id: 'dreamworks', name: 'DreamWorks Animation', keywords: ['shrek', 'how to train your dragon', 'kung fu panda', 'madagascar'] },
        { id: 'gaming', name: 'Video Games', keywords: ['nintendo', 'playstation', 'esports', 'minecraft', 'fortnite'] },
        { id: 'youtubers', name: 'YouTubers and Content Creators', keywords: ['vegetta777', 'elrubius', 'quackity', 'auronplay'] },
        { id: 'kpop', name: 'K-Pop and Asian Pop Culture', keywords: ['korean dramas', 'kdrama'] },
        { id: 'fun_facts', name: 'Fun Facts and Trivia', keywords: ['curiosities', 'surprising facts', 'behind the scenes', 'easter eggs'] },
        { id: 'memes', name: 'Internet Culture and Memes', keywords: ['viral trends', 'social media', 'internet phenomena'] },
        { id: 'scifi_fantasy', name: 'Sci-Fi and Fantasy Franchises', keywords: ['star wars', 'harry potter', 'lord of the rings', 'game of thrones'] },
      ],
    },
  ]

  private static readonly TIME_PERIODS: TimePeriod[] = [
    {
      id: 'ancient',
      name: 'ancient times',
      yearRange: [-3000, 500],
      applicableCategories: ['history', 'culture', 'science'],
    },
    {
      id: 'medieval',
      name: 'the medieval period',
      yearRange: [500, 1500],
      applicableCategories: ['history', 'culture', 'science'],
    },
    {
      id: 'renaissance',
      name: 'the Renaissance',
      yearRange: [1400, 1600],
      applicableCategories: ['history', 'culture', 'science'],
    },
    {
      id: 'early_modern',
      name: 'the early modern era',
      yearRange: [1500, 1800],
      applicableCategories: ['history', 'culture', 'science'],
    },
    {
      id: 'industrial',
      name: 'the Industrial Revolution',
      yearRange: [1760, 1840],
      applicableCategories: ['history', 'technology', 'science', 'culture'],
    },
    {
      id: 'late_1800s',
      name: 'the late 19th century',
      yearRange: [1850, 1900],
      applicableCategories: ['history', 'technology', 'science', 'culture'],
    },
    {
      id: 'early_1900s',
      name: 'the early 20th century',
      yearRange: [1900, 1950],
      applicableCategories: ['history', 'technology', 'science', 'culture', 'programming'],
    },
    {
      id: '1950s_60s',
      name: 'the 1950s and 1960s',
      yearRange: [1950, 1969],
      applicableCategories: ['history', 'technology', 'science', 'culture', 'programming'],
    },
    {
      id: '1970s',
      name: 'the 1970s',
      yearRange: [1970, 1979],
      applicableCategories: ['history', 'technology', 'science', 'culture', 'programming'],
    },
    {
      id: '1980s',
      name: 'the 1980s',
      yearRange: [1980, 1989],
      applicableCategories: ['history', 'technology', 'science', 'culture', 'programming', 'pop_culture'],
    },
    {
      id: '1990s',
      name: 'the 1990s',
      yearRange: [1990, 1999],
      applicableCategories: ['history', 'technology', 'science', 'culture', 'programming', 'pop_culture'],
    },
    {
      id: '2000s',
      name: 'the 2000s',
      yearRange: [2000, 2010],
      applicableCategories: ['technology', 'science', 'culture', 'programming', 'pop_culture'],
    },
    {
      id: 'modern_computing',
      name: 'the modern computing era',
      yearRange: [1970, 2026],
      applicableCategories: ['technology', 'programming'],
    },
    {
      id: 'present',
      name: 'present day',
      yearRange: [2015, 2026],
      applicableCategories: ['technology', 'science', 'health', 'education', 'programming', 'culture', 'pop_culture'],
    },
  ]

  private static readonly CONTENT_TYPES: Record<ContentType, string> = {
    historical_fact: 'a historical fact or event',
    interesting_discovery: 'an interesting discovery or finding',
    how_it_works: 'an explanation of how something works',
    comparison: 'a comparison between two related concepts or things',
    evolution: 'the evolution or development of something over time',
    curious_phenomenon: 'a curious or surprising phenomenon',
    practical_application: 'a practical application or real-world use case',
  }

  private static readonly PERSPECTIVES: Record<ContentPerspective, string> = {
    causes: 'the causes and origins',
    effects: 'the effects and consequences',
    process: 'the process and methodology',
    comparison: 'comparisons and contrasts',
    evolution: 'evolution and changes over time',
    benefits: 'the benefits and advantages',
    challenges: 'the challenges and difficulties',
  }

  private static readonly GEOGRAPHIC_REGIONS: GeographicRegion[] = [
    'global',
    'europe',
    'asia',
    'americas',
    'africa',
    'oceania',
  ]

  private static readonly UNIQUE_FOCUS_ELEMENTS: Record<TextCategory, string[]> = {
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
    science: [
      'the key discovery that changed everything',
      'how scientists made this breakthrough',
      'its practical applications',
      'ongoing mysteries and questions',
      'how it connects to other fields',
      'surprising facts most people don\'t know',
      'the experimental methods used',
      'future possibilities and research',
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
    health: [
      'evidence-based recommendations',
      'common myths debunked',
      'how lifestyle affects outcomes',
      'preventive measures',
      'the science behind it',
      'practical daily habits',
      'long-term vs short-term effects',
      'individual variations and factors',
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
      'fan theories and hidden meanings',
      'record-breaking achievements and milestones',
    ],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PÚBLICOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Genera un prompt con parámetros aleatorios
   */
  async generatePrompt(options?: GenerateTextOptions, userId?: number): Promise<GeneratedPrompt> {
    const startTime = Date.now()

    try {
      // Si hay seed, intentar parsearla
      if (options?.seed) {
        try {
          const prompt = this.generatePromptFromSeed(options.seed)
          await this.logService.logSeedParsed(options.seed, userId)
          await this.logService.logPromptGenerated(prompt.params, prompt, userId, Date.now() - startTime)
          return prompt
        } catch (error) {
          await this.logService.logSeedParseFailed(options.seed, error as Error, userId)
          // Continuar con generación aleatoria
        }
      }

      const params = this.generateRandomParams(options)
      const prompt = this.buildPrompt(params)

      await this.logService.logPromptGenerated(params, prompt, userId, Date.now() - startTime)

      return prompt
    } catch (error) {
      await this.logService.logPromptGenerationFailed(error as Error, options, userId)
      throw error
    }
  }

  /**
   * Regenera un prompt desde un seed
   */
  generatePromptFromSeed(seed: string): GeneratedPrompt {
    const params = this.parseSeed(seed)
    return this.buildPrompt(params)
  }

  /**
   * Obtiene las categorías disponibles
   */
  getAvailableCategories(): CategoryConfig[] {
    return PromptGeneratorService.CATEGORIES
  }

  /**
   * Obtiene los tamaños disponibles
   */
  getAvailableSizes(): TextSizeConfig[] {
    return Object.values(PromptGeneratorService.TEXT_SIZES)
  }

  /**
   * Obtiene los períodos temporales disponibles
   */
  getAvailableTimePeriods(): TimePeriod[] {
    return PromptGeneratorService.TIME_PERIODS
  }

  /**
   * Obtiene todas las opciones de generación formateadas para el endpoint
   */
  getGenerationOptions(): GenerationOptionsResponse {
    return {
      categories: PromptGeneratorService.CATEGORIES.map((cat) => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories.map((sub) => ({ id: sub.id, name: sub.name })),
        supportsTimePeriod: cat.supportsTimePeriod,
      })),
      sizes: Object.values(PromptGeneratorService.TEXT_SIZES).map((size) => ({
        id: size.label,
        label: size.label.charAt(0).toUpperCase() + size.label.slice(1),
        wordRange: `${size.min}-${size.max} words`,
        readingTime: size.readingTime,
      })),
      timePeriods: PromptGeneratorService.TIME_PERIODS.map((period) => ({
        id: period.id,
        name: period.name,
        yearRange:
          period.yearRange[0] < 0
            ? `${Math.abs(period.yearRange[0])} BCE - ${period.yearRange[1]} CE`
            : `${period.yearRange[0]} - ${period.yearRange[1]}`,
      })),
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE RANDOMIZACIÓN (PRIVADOS)
  // ═══════════════════════════════════════════════════════════════════════════

  private generateRandomParams(options?: GenerateTextOptions): RandomPromptParams {
    // Seleccionar categoría
    const primaryCategory = options?.category ?? this.selectRandomCategory()
    const categoryConfig = this.getCategoryConfig(primaryCategory)

    // Seleccionar subcategorías (1-2)
    const subcategoryCount = this.randomInt(1, 2)
    const subcategories = this.selectRandomSubcategories(categoryConfig, subcategoryCount)

    // Seleccionar tamaño
    const textSize = options?.size
      ? PromptGeneratorService.TEXT_SIZES[options.size]
      : this.selectRandomSize()

    // Seleccionar dificultad (si no se especifica, elegir aleatoriamente)
    const difficulty = options?.difficulty
      ? PromptGeneratorService.DIFFICULTY_LEVELS[options.difficulty]
      : this.selectRandomDifficulty()

    // Seleccionar período temporal (solo si la categoría lo soporta)
    let timePeriod: TimePeriod | undefined
    let specificYear: number | undefined

    if (categoryConfig.supportsTimePeriod) {
      if (options?.timePeriod) {
        timePeriod = this.getTimePeriodById(options.timePeriod)
      } else if (this.shouldInclude(0.7)) {
        // 70% de probabilidad de incluir período temporal
        timePeriod = this.selectTimePeriodForCategory(primaryCategory)
      }

      if (timePeriod && this.shouldInclude(0.5)) {
        // 50% de probabilidad de año específico
        specificYear = this.selectRandomYear(timePeriod)
      }
    }

    // Seleccionar tipo de contenido y perspectiva
    const contentType = this.selectRandomContentType()
    const perspective = this.selectRandomPerspective()

    // Seleccionar contexto geográfico (30% de probabilidad)
    const geographicContext = this.shouldInclude(0.3)
      ? this.selectRandomGeographicContext()
      : undefined

    // Seleccionar elemento de enfoque único
    const uniqueFocusElement = this.selectRandomFocusElement(primaryCategory)

    return {
      primaryCategory,
      subcategories,
      timePeriod,
      specificYear,
      textSize,
      difficulty,
      contentType,
      perspective,
      geographicContext,
      uniqueFocusElement,
    }
  }

  private selectRandomCategory(): TextCategory {
    const categories = PromptGeneratorService.CATEGORIES
    return this.randomElement(categories).id
  }

  private selectRandomSubcategories(categoryConfig: CategoryConfig, count: number): string[] {
    return this.randomElements(categoryConfig.subcategories, count).map((sub) => sub.name)
  }

  private selectTimePeriodForCategory(category: TextCategory): TimePeriod | undefined {
    const applicablePeriods = PromptGeneratorService.TIME_PERIODS.filter((period) =>
      period.applicableCategories.includes(category)
    )

    if (applicablePeriods.length === 0) return undefined

    return this.randomElement(applicablePeriods)
  }

  private selectRandomYear(period: TimePeriod): number {
    return this.randomInt(period.yearRange[0], period.yearRange[1])
  }

  private selectRandomSize(): TextSizeConfig {
    const sizes = Object.values(PromptGeneratorService.TEXT_SIZES)
    return this.randomElement(sizes)
  }

  private selectRandomDifficulty(): DifficultyConfig {
    const difficulties = Object.values(PromptGeneratorService.DIFFICULTY_LEVELS)
    return this.randomElement(difficulties)
  }

  private selectRandomContentType(): ContentType {
    const types = Object.keys(PromptGeneratorService.CONTENT_TYPES) as ContentType[]
    return this.randomElement(types)
  }

  private selectRandomPerspective(): ContentPerspective {
    const perspectives = Object.keys(PromptGeneratorService.PERSPECTIVES) as ContentPerspective[]
    return this.randomElement(perspectives)
  }

  private selectRandomGeographicContext(): GeographicRegion {
    return this.randomElement(PromptGeneratorService.GEOGRAPHIC_REGIONS)
  }

  private selectRandomFocusElement(category: TextCategory): string {
    const elements = PromptGeneratorService.UNIQUE_FOCUS_ELEMENTS[category]
    return this.randomElement(elements)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE PROMPTS (PRIVADOS)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildPrompt(params: RandomPromptParams): GeneratedPrompt {
    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(params)
    const seed = this.generateSeed(params)

    return {
      systemPrompt,
      userPrompt,
      params,
      seed,
    }
  }

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
  "category": "${PromptGeneratorService.CATEGORIES.map((c) => c.id).join(' | ')}",
  "difficulty": "easy | medium | hard"
}

Do not include any text before or after the JSON. Only output the JSON object.
    `.trim()
  }

  private buildUserPrompt(params: RandomPromptParams): string {
    const categoryConfig = this.getCategoryConfig(params.primaryCategory)
    const contentTypeDesc = PromptGeneratorService.CONTENT_TYPES[params.contentType]
    const perspectiveDesc = PromptGeneratorService.PERSPECTIVES[params.perspective]

    let prompt = `
Generate a reading text in English with the following specific constraints:

TOPIC REQUIREMENTS:
- Primary topic: ${categoryConfig.name}, focusing on ${params.subcategories.join(' and ')}
- Content type: Write about ${contentTypeDesc}
- Perspective: Focus on ${perspectiveDesc}
- Unique angle: Explore ${params.uniqueFocusElement}
`

    // Añadir contexto temporal si aplica
    if (params.timePeriod) {
      prompt += `
TEMPORAL CONTEXT:
- Time period: ${params.timePeriod.name}${params.specificYear ? ` (around ${params.specificYear})` : ''}
- Reference this era's context, terminology, and developments
`
    }

    // Añadir contexto geográfico si aplica
    if (params.geographicContext) {
      const regionNames: Record<GeographicRegion, string> = {
        global: 'a global perspective',
        europe: 'Europe',
        asia: 'Asia',
        americas: 'the Americas',
        africa: 'Africa',
        oceania: 'Oceania',
      }
      prompt += `
GEOGRAPHIC SCOPE:
- Consider ${regionNames[params.geographicContext]}
`
    }

    prompt += `
TEXT SPECIFICATIONS:
- Length: ${params.textSize.min}-${params.textSize.max} words (${params.textSize.label} length)
- Style: Informative and explanatory, like a short article
- Tone: Neutral and engaging

LANGUAGE LEVEL REQUIREMENTS (CRITICAL - THIS IS THE DIFFICULTY):
- Target level: ${params.difficulty.description}
- The output "difficulty" field MUST be "${params.difficulty.id}"
- VOCABULARY: ${params.difficulty.vocabularyGuidelines}
- GRAMMAR: ${params.difficulty.grammarGuidelines}

STRICT RULES:
- Do NOT tell a story or create characters
- Do NOT use personal names or experiences
- Do NOT write in first or third person narrative
- Do NOT use bullet points or numbered lists in the content
- Output ONLY the JSON object as specified
`

    return prompt.trim()
  }

  private generateSeed(params: RandomPromptParams): string {
    const parts: string[] = []

    // Categoría (abreviada)
    const categoryAbbr = params.primaryCategory.slice(0, 4)
    parts.push(categoryAbbr)

    // Primera subcategoría (abreviada, sin espacios)
    if (params.subcategories.length > 0) {
      const subAbbr = params.subcategories[0]
        .toLowerCase()
        .replace(/\s+/g, '')
        .slice(0, 6)
      parts.push(subAbbr)
    }

    // Período temporal
    if (params.timePeriod) {
      parts.push(params.timePeriod.id.replace(/_/g, ''))
    } else {
      parts.push('none')
    }

    // Tamaño
    parts.push(params.textSize.label.slice(0, 3))

    // Dificultad (abreviada: eas, med, har)
    parts.push(params.difficulty.id.slice(0, 3))

    // Tipo de contenido (abreviado)
    const contentAbbr = params.contentType.split('_')[0].slice(0, 4)
    parts.push(contentAbbr)

    // Timestamp
    parts.push(Date.now().toString())

    return parts.join('_')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARSING DE SEEDS (PRIVADOS)
  // ═══════════════════════════════════════════════════════════════════════════

  private parseSeed(seed: string): RandomPromptParams {
    const parts = seed.split('_')

    if (parts.length < 6) {
      throw new Error('Invalid seed format')
    }

    // Intentar reconstruir los parámetros desde el seed
    const categoryAbbr = parts[0]
    const timePeriodId = parts[2]
    const sizeAbbr = parts[3]
    const difficultyAbbr = parts[4]

    // Encontrar categoría
    const category = PromptGeneratorService.CATEGORIES.find((c) =>
      c.id.startsWith(categoryAbbr)
    )
    if (!category) {
      throw new Error('Invalid category in seed')
    }

    // Encontrar tamaño
    const size = Object.values(PromptGeneratorService.TEXT_SIZES).find((s) =>
      s.label.startsWith(sizeAbbr)
    )
    if (!size) {
      throw new Error('Invalid size in seed')
    }

    // Encontrar dificultad
    const difficulty = Object.values(PromptGeneratorService.DIFFICULTY_LEVELS).find((d) =>
      d.id.startsWith(difficultyAbbr)
    )
    if (!difficulty) {
      throw new Error('Invalid difficulty in seed')
    }

    // Encontrar período temporal
    let timePeriod: TimePeriod | undefined
    if (timePeriodId !== 'none') {
      timePeriod = PromptGeneratorService.TIME_PERIODS.find(
        (p) => p.id.replace(/_/g, '') === timePeriodId
      )
    }

    // Generar el resto aleatoriamente (no se puede reconstruir exactamente)
    const subcategoryCount = this.randomInt(1, 2)
    const subcategories = this.selectRandomSubcategories(category, subcategoryCount)

    return {
      primaryCategory: category.id,
      subcategories,
      timePeriod,
      specificYear: timePeriod ? this.selectRandomYear(timePeriod) : undefined,
      textSize: size,
      difficulty,
      contentType: this.selectRandomContentType(),
      perspective: this.selectRandomPerspective(),
      geographicContext: this.shouldInclude(0.3) ? this.selectRandomGeographicContext() : undefined,
      uniqueFocusElement: this.selectRandomFocusElement(category.id),
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES (PRIVADOS)
  // ═══════════════════════════════════════════════════════════════════════════

  private getCategoryConfig(categoryId: TextCategory): CategoryConfig {
    const config = PromptGeneratorService.CATEGORIES.find((c) => c.id === categoryId)
    if (!config) {
      throw new Error(`Category not found: ${categoryId}`)
    }
    return config
  }

  private getTimePeriodById(periodId: string): TimePeriod | undefined {
    return PromptGeneratorService.TIME_PERIODS.find((p) => p.id === periodId)
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private randomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, array.length))
  }

  private shouldInclude(probability: number): boolean {
    return Math.random() < probability
  }
}
