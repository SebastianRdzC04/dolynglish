import type { TextCategory } from './api_response.js'

/**
 * Tamaños de texto disponibles
 */
export type TextSize = 'short' | 'medium' | 'long'

/**
 * Niveles de dificultad que el usuario puede solicitar
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/**
 * Niveles CEFR del Marco Común Europeo
 */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/**
 * Configuración de dificultad con niveles CEFR correspondientes
 */
export interface DifficultyConfig {
  id: DifficultyLevel
  label: string
  cefrLevels: [CEFRLevel, CEFRLevel]
  description: string
  vocabularyGuidelines: string
  grammarGuidelines: string
}

/**
 * Configuración de un tamaño de texto
 */
export interface TextSizeConfig {
  min: number
  max: number
  label: TextSize
  readingTime: string
}

/**
 * Período temporal con contexto
 */
export interface TimePeriod {
  id: string
  name: string
  yearRange: [number, number]
  applicableCategories: TextCategory[]
}

/**
 * Subcategoría de un tema
 */
export interface Subcategory {
  id: string
  name: string
  keywords: string[]
}

/**
 * Configuración completa de una categoría
 */
export interface CategoryConfig {
  id: TextCategory
  name: string
  subcategories: Subcategory[]
  supportsTimePeriod: boolean
  defaultTimePeriod?: string
}

/**
 * Tipo de contenido a generar
 */
export type ContentType =
  | 'historical_fact'
  | 'interesting_discovery'
  | 'how_it_works'
  | 'comparison'
  | 'evolution'
  | 'curious_phenomenon'
  | 'practical_application'

/**
 * Perspectiva o enfoque del contenido
 */
export type ContentPerspective =
  | 'causes'
  | 'effects'
  | 'process'
  | 'comparison'
  | 'evolution'
  | 'benefits'
  | 'challenges'

/**
 * Región geográfica para contexto
 */
export type GeographicRegion =
  | 'global'
  | 'europe'
  | 'asia'
  | 'americas'
  | 'africa'
  | 'oceania'

/**
 * Parámetros aleatorios generados para el prompt
 */
export interface RandomPromptParams {
  primaryCategory: TextCategory
  secondaryCategory?: TextCategory
  subcategories: string[]
  timePeriod?: TimePeriod
  specificYear?: number
  textSize: TextSizeConfig
  difficulty: DifficultyConfig
  contentType: ContentType
  perspective: ContentPerspective
  geographicContext?: GeographicRegion
  uniqueFocusElement: string
}

/**
 * Opciones que el usuario puede pasar al generar
 */
export interface GenerateTextOptions {
  category?: TextCategory
  size?: TextSize
  difficulty?: DifficultyLevel
  timePeriod?: string
  seed?: string
}

/**
 * Prompt generado listo para enviar a la IA
 */
export interface GeneratedPrompt {
  systemPrompt: string
  userPrompt: string
  params: RandomPromptParams
  seed: string
}

/**
 * Respuesta del endpoint de opciones disponibles
 */
export interface GenerationOptionsResponse {
  categories: Array<{
    id: TextCategory
    name: string
    subcategories: Array<{ id: string; name: string }>
    supportsTimePeriod: boolean
  }>
  sizes: Array<{
    id: TextSize
    label: string
    wordRange: string
    readingTime: string
  }>
  timePeriods: Array<{
    id: string
    name: string
    yearRange: string
  }>
}
