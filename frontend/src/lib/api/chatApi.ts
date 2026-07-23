import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface Citation {
  document_id: string;
  filename: string;
  page_number: number;
  chunk_id: string;
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  citations: Citation[];
  session_id: string;
}

export interface ChatSessionResponse {
  id: string;
  created_at: string;
}

export interface ChatMessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence: number | null;
  citations: Citation[] | null;
  created_at: string;
}

export const chatApi = {
  /**
   * Send a message to the copilot RAG pipeline.
   * If no session_id is provided, a new session is created automatically.
   * POST /api/copilot/query
   * Body: { query: string, session_id?: string }
   * Returns: { answer, confidence, citations, session_id }
   */
  query: (query: string, sessionId?: string): Promise<QueryResponse> =>
    apiClient.post<QueryResponse>(API_ENDPOINTS.copilot.query, {
      query,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),

  /**
   * List all chat sessions for the current user.
   * GET /api/copilot/sessions
   */
  getSessions: (): Promise<ChatSessionResponse[]> =>
    apiClient.get<ChatSessionResponse[]>(API_ENDPOINTS.copilot.sessions),

  getHistory: (sessionId: string): Promise<ChatMessageResponse[]> =>
    apiClient.get<ChatMessageResponse[]>(API_ENDPOINTS.copilot.sessionHistory(sessionId)),

  send: (req: import('../../types/api').ChatRequest, signal?: AbortSignal): Promise<import('../../types/api').ChatResponse> =>
    apiClient.post<import('../../types/api').ChatResponse>(API_ENDPOINTS.copilot.query, {
      query: req.message,
      ...(req.conversation_id ? { session_id: req.conversation_id } : {}),
    }),

  stream: async function* (req: import('../../types/api').ChatRequest, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const res = await chatApi.send(req, signal);
    yield JSON.stringify({
      token: res.answer,
      citations: res.citations,
      conversation_id: res.session_id
    });
  }
};
