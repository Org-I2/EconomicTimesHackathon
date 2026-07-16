/** Chat API client — SRD 8.8 */
import { apiClient, streamSSE } from './client';
import type { ChatRequest, ChatResponse } from '@/types/api';

export const chatApi = {
  /** POST /chat — Non-streaming RAG chat (fallback) */
  send: (data: ChatRequest): Promise<ChatResponse> =>
    apiClient.post<ChatResponse>('/chat', data),

  /** POST /chat — Streaming RAG chat via SSE (SRD 8.8) */
  stream: (data: ChatRequest, signal?: AbortSignal) =>
    streamSSE('/chat', data, signal),
};
