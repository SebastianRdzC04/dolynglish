/**
 * Caché local para explicaciones de texto
 * Almacena explicaciones en AsyncStorage para reducir llamadas API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExplanationResponse } from '../types';

const CACHE_PREFIX = 'explanation_cache_';
const CACHE_TTL_DAYS = 7; // Time to live: 7 días

interface CachedExplanation {
  data: ExplanationResponse;
  timestamp: number;
  readingId: number;
  selection: string;
}

/**
 * Genera una clave única para una explicación
 * Usa un hash simple basado en readingId + selección normalizada
 */
function generateCacheKey(readingId: number, selection: string): string {
  const normalized = selection.trim().toLowerCase().replace(/\s+/g, ' ');
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CACHE_PREFIX}${readingId}_${Math.abs(hash)}`;
}

/**
 * Verifica si una entrada de caché está expirada
 */
function isExpired(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000; // 7 días en ms
  return (now - timestamp) > maxAge;
}

/**
 * Guarda una explicación en el caché
 */
export async function cacheExplanation(
  readingId: number,
  selection: string,
  explanation: ExplanationResponse
): Promise<void> {
  try {
    const key = generateCacheKey(readingId, selection);
    const cached: CachedExplanation = {
      data: explanation,
      timestamp: Date.now(),
      readingId,
      selection: selection.trim(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache explanation:', error);
    // No lanzar error, el caché es opcional
  }
}

/**
 * Recupera una explicación del caché si existe y no está expirada
 */
export async function getCachedExplanation(
  readingId: number,
  selection: string
): Promise<ExplanationResponse | null> {
  try {
    const key = generateCacheKey(readingId, selection);
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const parsed: CachedExplanation = JSON.parse(cached);
    
    // Verificar si está expirado
    if (isExpired(parsed.timestamp)) {
      // Eliminar entrada expirada
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to get cached explanation:', error);
    return null;
  }
}

/**
 * Limpia todas las explicaciones cacheadas
 */
export async function clearExplanationCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Failed to clear explanation cache:', error);
  }
}

/**
 * Limpia solo las entradas expiradas del caché
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
    
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed: CachedExplanation = JSON.parse(cached);
        if (isExpired(parsed.timestamp)) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clean expired cache:', error);
  }
}

/**
 * Obtiene estadísticas del caché
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  validEntries: number;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
    
    let expiredCount = 0;
    
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed: CachedExplanation = JSON.parse(cached);
        if (isExpired(parsed.timestamp)) {
          expiredCount++;
        }
      }
    }

    return {
      totalEntries: cacheKeys.length,
      expiredEntries: expiredCount,
      validEntries: cacheKeys.length - expiredCount,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { totalEntries: 0, expiredEntries: 0, validEntries: 0 };
  }
}
