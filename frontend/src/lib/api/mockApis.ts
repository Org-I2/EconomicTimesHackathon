import type { DocumentResponse } from './documentsApi';

// --- MOCK COMPLIANCE API ---
export const complianceApi = {
  dashboard: async (windowDays: number) => {
    return {
      valid: [] as any[],
      expiring_soon: [] as any[],
      expired: [] as any[]
    };
  }
};

// --- MOCK AUDIT API ---
export const auditApi = {
  history: async (params?: any) => {
    return {
      items: [
        { event_id: 'evt-1', event_type: 'UPLOAD', timestamp: new Date().toISOString(), user_id: 'user1', resource_id: 'doc-1', details: {} }
      ],
      total: 1,
      page: 1,
      page_size: 10,
      total_pages: 1
    };
  }
};

// --- MOCK LESSONS API ---
export const lessonsApi = {
  create: async (data: any) => ({ id: 'lesson-1', ...data }),
  list: async (params?: any) => ({ items: [] as any[], total: 0 }),
  get: async (id: string) => ({ id, title: 'Mock Lesson', content: 'Mock Content', created_at: new Date().toISOString(), author: 'System', equipment_tag: 'PUMP-1', tags: ['mock'] })
};

// --- MOCK MAINTENANCE API ---
export const maintenanceApi = {
  getRecommendations: async (tag: string) => ({
    equipment_tag: tag,
    recommendations: ['Check seals', 'Lubricate bearings'],
    estimated_next_maintenance: new Date(Date.now() + 30 * 86400000).toISOString(),
    confidence_score: 0.85,
    reasoning: 'Mock reasoning based on past data.',
    supporting_documents: [{ document_id: 'doc-1', filename: 'Manual.pdf', title: 'Manual', relevance: 0.9, date: new Date().toISOString(), snippet: 'Mock snippet' }]
  })
};

import { documentsApi } from './documentsApi';

// --- MOCK SEARCH API ---
export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type: string;
  score: number;
  chunk_id: string;
  document_id: string;
  filename: string;
  page_number: number;
}
export const searchApi = {
  search: async (params: any) => {
    // 1. Fetch all documents from the real backend
    const docsData = await documentsApi.list();
    let allDocs = docsData.items;

    // 2. Filter by search query (simple filename match)
    const query = (params.query || '').toLowerCase();
    if (query) {
      allDocs = allDocs.filter((doc: any) => doc.filename.toLowerCase().includes(query));
    }

    // 3. Filter by document_type
    if (params.filters?.document_type) {
      allDocs = allDocs.filter((doc: any) => doc.document_type === params.filters.document_type);
    }

    // 4. Filter by equipment_tag
    if (params.filters?.equipment_tag) {
      allDocs = allDocs.filter((doc: any) => doc.equipment_tag === params.filters.equipment_tag);
    }

    // 5. Map to SearchResult
    const results = allDocs.map((doc: any, index: number) => ({
      id: `res-${doc.document_id}`,
      title: doc.filename,
      snippet: `Document matches search for: ${query || 'all documents'}.`,
      type: 'document',
      score: 1.0 - (index * 0.05), // Fake score
      chunk_id: `chunk-${index}`,
      document_id: doc.document_id,
      filename: doc.filename,
      page_number: 1,
    } as SearchResult));

    return { results, total: results.length };
  }
};

// --- MOCK RCA API ---
export const rcaApi = {
  analyze: async (data: { incident_description: string }) => {
    return {
      analysis: 'This is a mock analysis for the incident: ' + data.incident_description,
      recommended_actions: ['Action 1', 'Action 2'],
      probable_factors: [{ factor: 'Factor 1', citations: [] }],
      related_documents: [{ document_id: 'doc-1', filename: 'Log.txt' }],
      similar_incidents: [
        { document_id: 'doc-4', filename: 'Past_Incident.pdf', snippet: 'Similar incident occurred in 2022.' }
      ]
    };
  }
};

