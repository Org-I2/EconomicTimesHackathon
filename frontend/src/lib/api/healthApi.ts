/** Health API client — SRD 8.20 */
import { apiClient } from './client';
import type { HealthResponse } from '@/types/api';

export const healthApi = {
  /** GET /health — System health check (SRD 8.20, no auth required) */
  check: (): Promise<HealthResponse> =>
    apiClient.get<HealthResponse>('/health'),
};
