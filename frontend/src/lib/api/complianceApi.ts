/** Compliance API client — SRD 8.12–8.13 */
import { apiClient } from './client';
import type { ComplianceCheckRequest, ComplianceCheckResponse, ComplianceDashboardResponse } from '@/types/api';

export const complianceApi = {
  /** POST /compliance/check — Tag/update compliance metadata (SRD 8.12) */
  check: (data: ComplianceCheckRequest): Promise<ComplianceCheckResponse> =>
    apiClient.post<ComplianceCheckResponse>('/compliance/check', data),

  /** GET /compliance/dashboard — Aggregated compliance view (SRD 8.13) */
  dashboard: (windowDays = 90): Promise<ComplianceDashboardResponse> =>
    apiClient.get<ComplianceDashboardResponse>('/compliance/dashboard', { window_days: windowDays }),
};
