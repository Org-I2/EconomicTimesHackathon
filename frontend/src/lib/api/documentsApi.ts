/** Documents API client — SRD 8.2–8.6 */
import { apiClient } from './client';
import type {
  UploadResponse,
  DocumentListItem,
  DocumentDetail,
  DocumentIndexRequest,
  DocumentIndexResponse,
  PaginatedResponse,
} from '@/types/api';

export interface DocumentsQueryParams {
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'filename';
  sort_order?: 'asc' | 'desc';
  document_type?: string;
  status?: string;
  equipment_tag?: string;
  is_compliance?: boolean;
  date_from?: string;
  date_to?: string;
}

export const documentsApi = {
  /** POST /documents/upload — Upload documents with metadata (SRD 8.2) */
  upload: (files: File[], metadata?: Record<string, unknown>): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files[]', file));
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiClient.upload<UploadResponse>('/documents/upload', formData);
  },

  /** GET /documents — List documents with filters (SRD 8.4) */
  list: (params?: DocumentsQueryParams): Promise<PaginatedResponse<DocumentListItem>> =>
    apiClient.get<PaginatedResponse<DocumentListItem>>('/documents', params as Record<string, string | number | boolean>),

  /** GET /documents/{id} — Get document detail (SRD 8.5) */
  getById: (id: string): Promise<DocumentDetail> =>
    apiClient.get<DocumentDetail>(`/documents/${id}`),

  /** DELETE /documents/{id} — Delete a document (SRD 8.6) */
  delete: (id: string): Promise<void> =>
    apiClient.delete<void>(`/documents/${id}`),

  /** POST /documents/index — Trigger re-indexing (SRD 8.3) */
  reindex: (data: DocumentIndexRequest): Promise<DocumentIndexResponse> =>
    apiClient.post<DocumentIndexResponse>('/documents/index', data),
};
