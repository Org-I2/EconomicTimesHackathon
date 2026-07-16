/** Knowledge Graph API client — SRD 8.9–8.10 */
import { apiClient } from './client';
import type { GraphBuildRequest, GraphBuildResponse, NodeDetailResponse } from '@/types/api';

export const knowledgeApi = {
  /** POST /knowledge/build — Trigger graph build (SRD 8.9) */
  build: (data?: GraphBuildRequest): Promise<GraphBuildResponse> =>
    apiClient.post<GraphBuildResponse>('/knowledge/build', data),

  /** GET /knowledge/node/{id} — Get node details + edges (SRD 8.10) */
  getNode: (id: string): Promise<NodeDetailResponse> =>
    apiClient.get<NodeDetailResponse>(`/knowledge/node/${id}`),
};
