import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface DocumentResponse {
  document_id: string;
  filename: string;
  document_type: string;
  status: string;
  equipment_tag: string | null;
  created_at: string;
  updated_at: string;
  is_compliance: boolean;
  expiry_date: string | null;
  page_count: number | null;
  chunk_count: number | null;
  size_bytes: number;
}

export interface DocumentDetailResponse extends DocumentResponse {
  pages?: Array<any>;
  entities?: Array<any>;
}

// Helper to map backend format to frontend format
function mapDoc(doc: any): DocumentResponse {
  return {
    document_id: doc.id,
    filename: doc.filename,
    document_type: doc.doc_type || 'Unknown',
    status: doc.status || 'UPLOADED',
    equipment_tag: null, // Backend doesn't return this directly
    created_at: doc.uploaded_at || new Date().toISOString(),
    updated_at: doc.uploaded_at || new Date().toISOString(),
    is_compliance: false,
    expiry_date: null,
    page_count: null,
    chunk_count: doc.total_chunks ? parseInt(doc.total_chunks, 10) : null,
    size_bytes: 0
  };
}

export const documentsApi = {
  list: async (params: any = {}): Promise<{ items: DocumentResponse[], total: number, page: number, page_size: number, total_pages: number }> => {
    const queryParams = { ...params };
    if (queryParams.document_type) {
      queryParams.doc_type = queryParams.document_type;
      delete queryParams.document_type;
    }
    const data = await apiClient.get<any>(API_ENDPOINTS.documents.list, queryParams);
    
    // Process response (supporting both paginated {items} or plain arrays depending on backend format)
    if (data && data.items) {
      return { ...data, items: data.items.map(mapDoc) };
    }
    const items: DocumentResponse[] = (Array.isArray(data) ? data : []).map(mapDoc);
    
    // Fallback: manually filter by status if the backend ignored the query param
    let filteredItems = items;
    if (queryParams.status) {
      filteredItems = filteredItems.filter(doc => doc.status === queryParams.status);
    }
    if (queryParams.doc_type) {
      filteredItems = filteredItems.filter(doc => doc.document_type === queryParams.doc_type);
    }
    
    return { items: filteredItems, total: filteredItems.length, page: params.page || 1, page_size: params.page_size || filteredItems.length || 10, total_pages: 1 };
  },

  upload: async (file: File, docType: string): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    const data = await apiClient.upload<any>(API_ENDPOINTS.documents.upload, formData);
    return mapDoc(data);
  },

  getById: async (id: string): Promise<DocumentDetailResponse> => {
    const data = await apiClient.get<any>(API_ENDPOINTS.documents.byId(id));
    return {
      ...mapDoc(data),
      pages: data.pages || [],
      entities: data.entities || []
    };
  },

  delete: (id: string): Promise<void> =>
    apiClient.delete<void>(API_ENDPOINTS.documents.delete(id)),

  retry: async (id: string): Promise<DocumentResponse> => {
    const data = await apiClient.post<any>(API_ENDPOINTS.documents.retry(id));
    return mapDoc(data);
  },
};

