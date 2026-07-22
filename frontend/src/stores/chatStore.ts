/** Chat store — manages active conversation, messages, and streaming state (Zustand) */
import { create } from 'zustand';
import type { ChatMessage, Citation } from '@/types/api';
import { generateId } from '@/utils';

interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId: string | null;

  /** Start a new conversation */
  newConversation: () => void;

  /** Set the active conversation ID */
  setConversationId: (id: string) => void;

  /** Add a user message */
  addUserMessage: (content: string) => string;

  /** Begin streaming an assistant message */
  beginAssistantMessage: () => string;

  /** Append a token to the currently streaming message */
  appendToken: (token: string) => void;

  /** Finalize the streaming message with citations */
  finalizeMessage: (citations: Citation[]) => void;

  /** Set a complete assistant message (non-streaming fallback) */
  setAssistantMessage: (messageId: string, content: string, citations: Citation[]) => void;

  /** Set error on the streaming message */
  setStreamingError: (error: string) => void;

  /** Clear all messages */
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: null,
  messages: [],
  isStreaming: false,
  streamingMessageId: null,

  newConversation: () =>
    set({
      conversationId: null,
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
    }),

  setConversationId: (id) => set({ conversationId: id }),

  addUserMessage: (content) => {
    const id = generateId();
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  beginAssistantMessage: () => {
    const id = generateId();
    set((s) => ({
      isStreaming: true,
      streamingMessageId: id,
      messages: [
        ...s.messages,
        {
          id,
          role: 'assistant',
          content: '',
          citations: [],
          isStreaming: true,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  appendToken: (token) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === streamingMessageId ? { ...m, content: m.content + token } : m
      ),
    }));
  },

  finalizeMessage: (citations) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      isStreaming: false,
      streamingMessageId: null,
      messages: s.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, isStreaming: false, citations }
          : m
      ),
    }));
  },

  setAssistantMessage: (messageId, content, citations) => {
    set((s) => ({
      isStreaming: false,
      streamingMessageId: null,
      messages: s.messages.map((m) =>
        m.id === messageId
          ? { ...m, content, citations, isStreaming: false }
          : m
      ),
    }));
  },

  setStreamingError: (error) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((s) => ({
      isStreaming: false,
      streamingMessageId: null,
      messages: s.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: error, isStreaming: false }
          : m
      ),
    }));
  },

  clearMessages: () =>
    set({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
    }),
}));
