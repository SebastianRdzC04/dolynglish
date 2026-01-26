// Servicio para endpoints de lecturas
import { apiService, ApiResponse } from "./api.service";
import {
  Reading,
  PendingReadingsResponse,
  CompletedReadingsResponse,
  EvaluationResult,
  EvaluateRequest,
  GenerateReadingOptions,
  GenerateReadingResponse,
} from "@/types/readings";

class ReadingsService {
  /**
   * Obtiene las lecturas pendientes del usuario
   * GET /readings/pending
   */
  async getPending(): Promise<PendingReadingsResponse> {
    const response = await apiService.get<ApiResponse<PendingReadingsResponse>>(
      "/readings/pending"
    );
    return response.data;
  }

  /**
   * Obtiene las lecturas completadas del usuario
   * GET /readings/completed
   */
  async getCompleted(): Promise<CompletedReadingsResponse> {
    const response = await apiService.get<ApiResponse<CompletedReadingsResponse>>(
      "/readings/completed"
    );
    return response.data;
  }

  /**
   * Obtiene una lectura específica por ID
   * GET /readings/:id
   */
  async getById(id: number): Promise<Reading> {
    const response = await apiService.get<ApiResponse<Reading>>(`/readings/${id}`);
    return response.data;
  }

  /**
   * Genera una nueva lectura
   * POST /readings/generate
   */
  async generate(options?: GenerateReadingOptions): Promise<GenerateReadingResponse> {
    // Construir query string con opciones
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.size) params.append("size", options.size);
    if (options?.timePeriod) params.append("timePeriod", options.timePeriod);
    if (options?.seed) params.append("seed", options.seed);

    const queryString = params.toString();
    const endpoint = `/readings/generate${queryString ? `?${queryString}` : ""}`;

    const response = await apiService.post<ApiResponse<GenerateReadingResponse>>(endpoint);
    return response.data;
  }

  /**
   * Evalúa la respuesta del usuario sobre una lectura
   * POST /readings/:id/evaluate
   */
  async evaluate(id: number, request: EvaluateRequest): Promise<EvaluationResult> {
    const response = await apiService.post<ApiResponse<EvaluationResult>>(
      `/readings/${id}/evaluate`,
      request
    );
    return response.data;
  }
}

export const readingsService = new ReadingsService();
