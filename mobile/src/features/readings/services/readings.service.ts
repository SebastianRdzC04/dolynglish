/**
 * Servicio de lecturas
 * Maneja todas las llamadas a la API relacionadas con lecturas
 */

import { apiClient, ApiResponse } from '@/src/core/api';
import {
  Reading,
  PendingReadingsResponse,
  CompletedReadingsResponse,
  EvaluationResult,
  EvaluateRequest,
  GenerateReadingOptions,
  GenerateReadingResponse,
} from '../types';

/**
 * Servicio para operaciones de lecturas
 */
class ReadingsService {
  /**
   * Obtiene las lecturas pendientes del usuario
   */
  async getPending(): Promise<PendingReadingsResponse> {
    const response = await apiClient.get<ApiResponse<PendingReadingsResponse>>(
      '/readings/pending'
    );
    return response.data;
  }

  /**
   * Obtiene las lecturas completadas del usuario
   */
  async getCompleted(): Promise<CompletedReadingsResponse> {
    const response = await apiClient.get<ApiResponse<CompletedReadingsResponse>>(
      '/readings/completed'
    );
    return response.data;
  }

  /**
   * Obtiene una lectura específica por ID
   */
  async getById(id: number): Promise<Reading> {
    const response = await apiClient.get<ApiResponse<Reading>>(`/readings/${id}`);
    return response.data;
  }

  /**
   * Genera una nueva lectura
   */
  async generate(options?: GenerateReadingOptions): Promise<GenerateReadingResponse> {
    // Construir query string con opciones
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.size) params.append('size', options.size);
    if (options?.timePeriod) params.append('timePeriod', options.timePeriod);
    if (options?.seed) params.append('seed', options.seed);

    const queryString = params.toString();
    const endpoint = `/readings/generate${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.post<ApiResponse<GenerateReadingResponse>>(endpoint);
    return response.data;
  }

  /**
   * Evalúa la respuesta del usuario sobre una lectura
   */
  async evaluate(id: number, request: EvaluateRequest): Promise<EvaluationResult> {
    const response = await apiClient.post<ApiResponse<EvaluationResult>>(
      `/readings/${id}/evaluate`,
      request
    );
    return response.data;
  }
}

export const readingsService = new ReadingsService();
