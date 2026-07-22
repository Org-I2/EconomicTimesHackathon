/** AI Chat Page — RAG copilot (SRD FR-5, 7.8) — the flagship experience */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, FileText, Sparkles, AlertCircle, RotateCcw, MessageSquare, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import type { ChatMessage, Citation } from '@/types/api';
import { cn } from '@/utils';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import toast from 'react-hot-toast';

/** AI Chat — streaming RAG copilot with citations */
export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [inputValue, setInputValue] = React.useState('');

  const {
    conversationId, messages, isStreaming,
    addUserMessage, beginAssistantMessage, appendToken,
    finalizeMessage, setStreamingError, setConversationId, newConversation,
  } = useChatStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue('');
    addUserMessage(message);
    const assistantMsgId = beginAssistantMessage();

    try {
      // Try streaming first
      abortRef.current = new AbortController();
      const stream = chatApi.stream(
        { message, conversation_id: conversationId || undefined, top_k: 6 },
        abortRef.current.signal
      );

      let fullResponse = '';
      let citations: Citation[] = [];

      for await (const chunk of stream) {
        try {
          const parsed = JSON.parse(chunk);
          if (parsed.token) {
            appendToken(parsed.token);
            fullResponse += parsed.token;
          }
          if (parsed.citations) {
            citations = parsed.citations;
          }
          if (parsed.conversation_id) {
            setConversationId(parsed.conversation_id);
          }
        } catch {
          // Plain text token
          appendToken(chunk);
          fullResponse += chunk;
        }
      }

      finalizeMessage(citations);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 503) {
          setStreamingError('⚠️ AI model is currently unavailable. Please ensure Ollama is running and try again.');
        } else if (err.status === 422) {
          setStreamingError('Message cannot be empty.');
        } else {
          setStreamingError(err.message);
        }
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
        finalizeMessage([]);
      } else {
        // Fallback to non-streaming
        try {
          const response = await chatApi.send({
            message,
            conversation_id: conversationId || undefined,
            top_k: 6,
          });
          useChatStore.getState().setAssistantMessage(assistantMsgId, response.answer, response.citations);
          if (response.conversation_id) setConversationId(response.conversation_id);
        } catch (fallbackErr) {
          const msg = fallbackErr instanceof ApiClientError ? fallbackErr.message : 'An unexpected error occurred';
          setStreamingError(msg);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-accent-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">AI Knowledge Copilot</h1>
            <p className="text-xs text-text-tertiary">Ask questions about your indexed documents • Answers are citation-grounded</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={newConversation} icon={<RotateCcw className="h-3.5 w-3.5" />}>
          New Chat
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border-primary bg-bg-secondary/50 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
              <Cpu className="h-8 w-8 text-accent-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Ask anything about your documents</h3>
            <p className="text-sm text-text-secondary text-center max-w-md mb-6">
              The AI copilot searches across all indexed documents and provides answers with citations back to the source.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What was the last inspection finding on P-204?',
                'List all maintenance records for V-101',
                'What SOPs mention high vibration?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInputValue(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 text-xs text-text-secondary bg-surface-primary border border-border-primary rounded-full hover:border-accent-500/50 hover:text-accent-500 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onCitationClick={(cit) => {
                navigate(`/documents/${cit.document_id}?page=${cit.page_number}&chunk=${cit.chunk_id}`);
              }} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className={cn(
        'shrink-0 rounded-xl border-2 bg-surface-primary',
        'transition-all duration-normal',
        'border-border-primary focus-within:border-accent-500/50 focus-within:shadow-lg focus-within:shadow-accent-500/5'
      )}>
        <div className="flex items-end gap-3 p-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none min-h-[24px] max-h-32"
            disabled={isStreaming}
            aria-label="Chat message input"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ======================== Chat Bubble ========================

interface ChatBubbleProps {
  message: ChatMessage;
  onCitationClick: (citation: Citation) => void;
}

function ChatBubble({ message, onCitationClick }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-accent-500" />
        </div>
      )}
      <div className={cn(
        'max-w-[80%] rounded-xl px-4 py-3',
        isUser
          ? 'bg-accent-500 text-text-on-accent rounded-tr-sm'
          : 'bg-surface-primary border border-border-primary rounded-tl-sm'
      )}>
        {/* Message content */}
        <div className={cn(
          'text-sm leading-relaxed prose prose-sm max-w-none',
          isUser ? 'prose-invert' : 'prose-zinc dark:prose-invert',
          message.isStreaming && 'typing-cursor'
        )}>
          {isUser ? (
            <p>{message.content}</p>
          ) : message.content ? (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          ) : (
            <div className="py-2">
              <LoadingExperience 
                isLoading={true} 
                variant="graph" 
                messages={['Preparing AI context...', 'Starting AI assistant...', 'Connecting to Ollama LLM...']}
                overlay={false}
                className="min-h-[120px]"
              />
            </div>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && !message.isStreaming && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border-secondary">
            {message.citations.map((cit, i) => (
              <button
                key={`${cit.document_id}-${cit.page_number}-${i}`}
                onClick={(e) => { e.stopPropagation(); onCitationClick(cit); }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs',
                  'bg-surface-secondary border border-border-primary',
                  'hover:border-accent-500/50 hover:text-accent-500',
                  'transition-colors cursor-pointer'
                )}
                title={`Open ${cit.filename} at page ${cit.page_number}`}
              >
                <FileText className="h-3 w-3" />
                <span className="font-medium truncate max-w-[120px]">{cit.filename}</span>
                <span className="text-text-tertiary">p.{cit.page_number}</span>
              </button>
            ))}
          </div>
        )}

        {/* No results indicator */}
        {!isUser && !message.isStreaming && message.citations?.length === 0 && message.content.includes('No relevant information') && (
          <div className="flex items-center gap-2 mt-2 text-text-tertiary">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">No matching documents found in the knowledge base</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-accent-500" />
        </div>
      )}
    </div>
  );
}
