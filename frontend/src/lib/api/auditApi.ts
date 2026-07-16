/** Audit Log API client — SRD 8.19 */
import { apiClient } from './client';
import type { AuditLogEntry, PaginatedResponse } from '@/types/api';

export interface AuditQueryParams {
  page?: number;
  page_size?: number;
  event_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export const auditApi = {
  /** GET /audit/history — View audit log (SRD 8.19) */
  history: (params?: AuditQueryParams): Promise<PaginatedResponse<AuditLogEntry>> =>
    apiClient.get<PaginatedResponse<AuditLogEntry>>('/audit/history', params as Record<string, string | number | boolean>),
};
