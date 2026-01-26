/**
 * Hook para obtener una lectura específica por ID
 */

import { useState, useEffect, useCallback } from 'react';
import { readingsService } from '../services';
import { Reading } from '../types';

interface UseReadingReturn {
  /** Datos de la lectura */
  reading: Reading | null;
  /** Si está cargando */
  isLoading: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Refrescar datos */
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener una lectura específica por ID
 */
export function useReading(id: number): UseReadingReturn {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await readingsService.getById(id);
      setReading(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar lectura');
      console.error('Error fetching reading:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReading();
    }
  }, [id, fetchReading]);

  return {
    reading,
    isLoading,
    error,
    refetch: fetchReading,
  };
}
