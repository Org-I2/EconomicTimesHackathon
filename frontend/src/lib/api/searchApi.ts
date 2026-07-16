/** Search API client — SRD 8.7 */
import { apiClient } from './client';
import type { SearchRequest, SearchResponse } from '@/types/api';

export const searchApi = {
  /** POST /search — Hybrid semantic + keyword search (SRD 8.7) */
  search: (data: SearchRequest): Promise<SearchResponse> =>
    apiClient.post<SearchResponse>('/search', data),
};
