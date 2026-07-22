/** TypeScript interfaces for every API request/response in SRD Section 8 */

// ======================== Generic Shapes ========================

/** Standard paginated response envelope (SRD Section 8 general conventions) */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Standard API error shape (SRD Section 8 general conventions) */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ======================== Auth (SRD 8.1) ========================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  role: UserRole;
}

export type UserRole = 'admin' | 'engineer';

// ======================== Documents (SRD 8.2–8.6) ========================

export type DocumentStatus = 'UPLOADED' | 'EXTRACTED' | 'EXTRACTION_FAILED' | 'INDEXED';

export type DocumentType =
  | 'SOP'
  | 'P&ID'
  | 'Inspection Report'
  | 'Manual'
  | 'Incident Report'
  | 'Work Order'
  | 'Email'
  | 'Compliance'
  | null;

export interface UploadMetadata {
  document_type?: DocumentType;
  equipment_tag?: string;
  is_compliance?: boolean;
  expiry_date?: string | null;
}

export interface UploadedDocumentSummary {
  document_id: string;
  filename: string;
  status: DocumentStatus;
  size_bytes: number;
}

export interface UploadResponse {
  uploaded: UploadedDocumentSummary[];
}

export interface DocumentListItem {
  document_id: string;
  filename: string;
  document_type: DocumentType;
  status: DocumentStatus;
  equipment_tag: string | null;
  created_at: string;
}

export interface DocumentDetail {
  document_id: string;
  filename: string;
  document_type: DocumentType;
  status: DocumentStatus;
  equipment_tag: string | null;
  is_compliance: boolean;
  expiry_date: string | null;
  page_count: number | null;
  chunk_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentIndexRequest {
  document_id: string;
  force?: boolean;
}

export interface DocumentIndexResponse {
  document_id: string;
  status: string;
}

// ======================== Search (SRD 8.7) ========================

export interface SearchRequest {
  query: string;
  filters?: {
    document_type?: string;
    equipment_tag?: string;
    date_from?: string;
    date_to?: string;
  };
  top_k?: number;
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  page_number: number;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

// ======================== Chat (SRD 8.8) ========================

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  top_k?: number;
}

export interface Citation {
  document_id: string;
  filename: string;
  page_number: number;
  chunk_id: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  session_id: string;
}

/** Local chat message representation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  timestamp: string;
}

// ======================== Knowledge Graph (SRD 8.9–8.10) ========================

export type GraphNodeType = 'Equipment' | 'Document' | 'Incident' | 'SOP' | 'Person' | 'LessonLearned';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
}

export interface GraphEdge {
  type: string;
  target: GraphNode;
}

export interface NodeDetailResponse {
  node: GraphNode;
  edges: GraphEdge[];
}

export interface GraphBuildRequest {
  document_id?: string;
}

export interface GraphBuildResponse {
  status: string;
}

// ======================== Maintenance (SRD 8.11) ========================

export interface TimelineEntry {
  date: string;
  document_id: string;
  type: string;
  summary: string;
}

export interface NextDueEstimate {
  date: string;
  basis: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface MaintenanceRecommendation {
  equipment_tag: string;
  timeline: TimelineEntry[];
  next_due_estimate: NextDueEstimate | null;
}

// ======================== Compliance (SRD 8.12–8.13) ========================

export interface ComplianceCheckRequest {
  document_id: string;
  is_compliance: boolean;
  expiry_date?: string;
}

export interface ComplianceCheckResponse {
  document_id: string;
  is_compliance: boolean;
  expiry_date: string;
  status: string;
}

export interface ComplianceItem {
  document_id: string;
  filename: string;
  expiry_date: string;
}

export interface ComplianceDashboardResponse {
  expired: ComplianceItem[];
  expiring_soon: ComplianceItem[];
  ok: ComplianceItem[];
}

// ======================== Lessons Learned (SRD 8.14–8.15) ========================

export interface LessonLearnedRequest {
  title: string;
  equipment_tag?: string;
  problem: string;
  resolution: string;
  tags?: string[];
}

export interface LessonLearnedListItem {
  lesson_id: string;
  title: string;
  equipment_tag: string | null;
  problem: string;
  resolution: string;
  tags: string[];
  created_by: string;
  created_at: string;
}

export interface LessonCreatedResponse {
  lesson_id: string;
  status: string;
}

// ======================== Root Cause Analysis (SRD 8.16) ========================

export interface RcaAnalyzeRequest {
  incident_description: string;
  equipment_tag?: string;
}

export interface ProbableFactor {
  factor: string;
  citations: Citation[];
}

export interface RcaAnalyzeResponse {
  analysis: string;
  recommended_actions: string[];
  probable_factors: ProbableFactor[];
  similar_incidents: { document_id: string; filename: string; snippet?: string }[];
  related_documents: { document_id: string; filename: string }[];
}

// ======================== OCR (SRD 8.17) ========================

export interface OcrResponse {
  text: string;
  average_confidence: number;
}

// ======================== Embeddings (SRD 8.18) ========================

export interface EmbeddingsRequest {
  texts: string[];
}

export interface EmbeddingsResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

// ======================== Audit (SRD 8.19) ========================

export interface AuditLogEntry {
  event_id: string;
  event_type: string;
  user_id: string | null;
  timestamp: string;
  details: Record<string, unknown> | null;
}

// ======================== Health (SRD 8.20) ========================

export interface HealthResponse {
  status: string;
  db: string;
  ollama: string;
  vector_index: string;
  model: string;
}

// ======================== User Management ========================

export interface User {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}
