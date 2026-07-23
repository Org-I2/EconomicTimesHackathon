/**
 * API Module Barrel Export
 *
 * All frontend code should import from '@/lib/api' (this file).
 * Do NOT import directly from individual API files to maintain a clean dependency graph.
 */

// Core client and config
export { apiClient, ApiClientError } from './client';
export { API_BASE_URL, API_ENDPOINTS } from './config';

// Feature API modules (all wired to actual backend endpoints)
export { authApi } from './authApi';
export { documentsApi } from './documentsApi';
export { chatApi } from './chatApi';
export { knowledgeApi } from './knowledgeApi';
export { agentsApi } from './agentsApi';
export { healthApi } from './healthApi';

// Type re-exports for convenience
export type { LoginResponse, SignupResponse } from './authApi';
export type { DocumentResponse, DocumentDetailResponse } from './documentsApi';
export type { QueryResponse, ChatSessionResponse, ChatMessageResponse, Citation } from './chatApi';
export type { GraphNode, GraphLink, GraphResponse, EntityResponse } from './knowledgeApi';
export type { RCAResponse, ComplianceResponse, GapDetail } from './agentsApi';
export type { HealthResponse } from './healthApi';

// Mock exports for missing endpoints
export { complianceApi, auditApi, lessonsApi, maintenanceApi, searchApi, rcaApi } from './mockApis';
