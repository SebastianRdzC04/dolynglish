// Hook para obtener y manejar lecturas
import { useState, useEffect, useCallback } from "react";
import { readingsService } from "@/services/readings.service";
import {
  Reading,
  PendingReadingsResponse,
  CompletedReadingsResponse,
  GenerateReadingOptions,
  GenerateReadingResponse,
} from "@/types/readings";

interface UseReadingsReturn {
  /** Lecturas pendientes */
  pendingReadings: Reading[];
  /** Información adicional de pending */
  pendingInfo: {
    count: number;
    maxPending: number;
    canGenerateMore: boolean;
  };
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
}

/**
 * Hook para manejar lecturas pendientes y completadas
 */
export function useReadings(): UseReadingsReturn {
  const [pendingReadings, setPendingReadings] = useState<Reading[]>([]);
  const [pendingInfo, setPendingInfo] = useState({
    count: 0,
    maxPending: 3,
    canGenerateMore: true,
  });
  const [completedReadings, setCompletedReadings] = useState<Reading[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      setError(null);
      const data = await readingsService.getPending();
      setPendingReadings(data.readings);
      setPendingInfo({
        count: data.pendingCount,
        maxPending: data.maxPending,
        canGenerateMore: data.canGenerateMore,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar lecturas");
      console.error("Error fetching pending readings:", err);
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
      setError(err instanceof Error ? err.message : "Error al cargar historial");
      console.error("Error fetching completed readings:", err);
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
        // Refrescar lista de pending después de generar
        await fetchPending();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar lectura");
        console.error("Error generating reading:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [pendingInfo.canGenerateMore, pendingInfo.maxPending, fetchPending]
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
  };
}

/**
 * Hook para obtener una lectura específica por ID
 */
export function useReading(id: number) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await readingsService.getById(id);
      setReading(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar lectura");
      console.error("Error fetching reading:", err);
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
