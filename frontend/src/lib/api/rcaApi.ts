/** Root Cause Analysis API client — SRD 8.16 */
import { apiClient } from './client';
import type { RcaAnalyzeRequest, RcaAnalyzeResponse } from '@/types/api';

export const rcaApi = {
  /** POST /rca/analyze — Root cause analysis (SRD 8.16) */
  analyze: (data: RcaAnalyzeRequest): Promise<RcaAnalyzeResponse> =>
    apiClient.post<RcaAnalyzeResponse>('/rca/analyze', data),
};
