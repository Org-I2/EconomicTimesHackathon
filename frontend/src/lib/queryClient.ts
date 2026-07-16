/** TanStack Query client configuration + query key factory */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s default stale time
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query key factory — ensures consistency across cache reads/invalidations */
export const queryKeys = {
  // Documents
  documents: {
    all: ['documents'] as const,
    list: (params?: Record<string, unknown>) => ['documents', 'list', params] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    processing: () => ['documents', 'processing'] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    results: (query: string, filters?: Record<string, unknown>) => ['search', query, filters] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    conversation: (id: string) => ['chat', id] as const,
  },

  // Knowledge Graph
  knowledge: {
    all: ['knowledge'] as const,
    node: (id: string) => ['knowledge', 'node', id] as const,
  },

  // Maintenance
  maintenance: {
    all: ['maintenance'] as const,
    recommendations: (tag: string) => ['maintenance', 'recommendations', tag] as const,
  },

  // Compliance
  compliance: {
    all: ['compliance'] as const,
    dashboard: (windowDays: number) => ['compliance', 'dashboard', windowDays] as const,
  },

  // Lessons Learned
  lessons: {
    all: ['lessons'] as const,
    list: (params?: Record<string, unknown>) => ['lessons', 'list', params] as const,
  },

  // RCA
  rca: {
    all: ['rca'] as const,
  },

  // Audit
  audit: {
    all: ['audit'] as const,
    history: (params?: Record<string, unknown>) => ['audit', 'history', params] as const,
  },

  // Health
  health: {
    all: ['health'] as const,
  },
} as const;
