/**
 * Hook para obtener y manejar lista de lecturas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { readingsService } from '../services';
import { Reading, GenerateReadingOptions, GenerateReadingResponse } from '../types';

interface PendingInfo {
  count: number;
  maxPending: number;
  canGenerateMore: boolean;
}

interface UseReadingsReturn {
  /** Lecturas pendientes */
  pendingReadings: Reading[];
  /** Información adicional de pending */
  pendingInfo: PendingInfo;
  /** Lecturas completadas */
  completedReadings: Reading[];
  /** Si está cargando pending */
  isLoadingPending: boolean;
  /** Si está cargando completed */
  isLoadingCompleted: boolean;
  /** Si está generando una lectura */
  isGenerating: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Refrescar lecturas pendientes */
  refetchPending: () => Promise<void>;
  /** Refrescar lecturas completadas */
  refetchCompleted: () => Promise<void>;
  /** Generar nueva lectura */
  generateReading: (options?: GenerateReadingOptions) => Promise<GenerateReadingResponse | null>;
  /** Eliminar una lectura pendiente */
  deleteReading: (id: number) => Promise<boolean>;
}

/**
 * Hook para manejar lecturas pendientes y completadas
 */
export function useReadings(): UseReadingsReturn {
  const [pendingReadings, setPendingReadings] = useState<Reading[]>([]);
  const [maxPending] = useState(3); // Límite máximo de lecturas pendientes
  const [completedReadings, setCompletedReadings] = useState<Reading[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular pendingInfo dinámicamente desde el estado local (optimización)
  const pendingInfo = useMemo<PendingInfo>(() => ({
    count: pendingReadings.length,
    maxPending,
    canGenerateMore: pendingReadings.length < maxPending,
  }), [pendingReadings.length, maxPending]);

  const fetchPending = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      setError(null);
      const data = await readingsService.getPending();
      setPendingReadings(data.readings);
      // pendingInfo se calcula automáticamente desde pendingReadings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar lecturas');
      console.error('Error fetching pending readings:', err);
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  const fetchCompleted = useCallback(async () => {
    try {
      setIsLoadingCompleted(true);
      setError(null);
      const data = await readingsService.getCompleted();
      setCompletedReadings(data.readings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
      console.error('Error fetching completed readings:', err);
    } finally {
      setIsLoadingCompleted(false);
    }
  }, []);

  const generateReading = useCallback(
    async (options?: GenerateReadingOptions): Promise<GenerateReadingResponse | null> => {
      if (!pendingInfo.canGenerateMore) {
        setError(`Límite de ${pendingInfo.maxPending} lecturas pendientes alcanzado`);
        return null;
      }

      try {
        setIsGenerating(true);
        setError(null);
        const data = await readingsService.generate(options);
        
        // Actualización optimista: agregar la nueva lectura al estado local
        setPendingReadings(prev => [...prev, data]);
        
        // No hacemos refetch porque navegamos inmediatamente a la lectura
        // El refetch se hará cuando el usuario vuelva a la pantalla principal
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al generar lectura');
        console.error('Error generating reading:', err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [pendingInfo.canGenerateMore, pendingInfo.maxPending]
  );

  const deleteReading = useCallback(
    async (id: number): Promise<boolean> => {
      // Guardar estado previo para rollback en caso de error
      const previousReadings = pendingReadings;
      
      try {
        setError(null);
        
        // 1. ACTUALIZACIÓN OPTIMISTA: Eliminar inmediatamente del estado local
        // Esto hace que la UI responda instantáneamente sin esperar al servidor
        setPendingReadings(prev => prev.filter(reading => reading.id !== id));
        
        // 2. Llamada al servidor en segundo plano
        await readingsService.delete(id);
        
        // 3. Éxito: el estado ya está actualizado
        return true;
      } catch (err) {
        // 4. ROLLBACK: Si falla, restaurar el estado previo
        setPendingReadings(previousReadings);
        setError(err instanceof Error ? err.message : 'Error al eliminar lectura');
        console.error('Error deleting reading:', err);
        return false;
      }
    },
    [pendingReadings]
  );

  // Cargar lecturas pendientes al montar
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return {
    pendingReadings,
    pendingInfo,
    completedReadings,
    isLoadingPending,
    isLoadingCompleted,
    isGenerating,
    error,
    refetchPending: fetchPending,
    refetchCompleted: fetchCompleted,
    generateReading,
    deleteReading,
  };
}
