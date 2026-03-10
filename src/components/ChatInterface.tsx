'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Loader2, FileText, Bot, User } from 'lucide-react';

interface Source {
  chunkId: string;
  documentId: string;
  title?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface ChatInterfaceProps {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export default function ChatInterface({
  conversationId,
  onConversationCreated,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) {
          setMessages(
            data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; sources: string }) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              sources: m.sources ? JSON.parse(m.sources) : [],
            }))
          );
        }
      } catch {
        // Silently fail — user can still send new messages
      }
    }

    loadMessages();
  }, [conversationId]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [input]);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: trimmed,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send message');
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        sources: data.message.sources ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If a new conversation was created, notify parent
      if (!conversationId && data.conversationId) {
        onConversationCreated?.(data.conversationId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">Start a conversation</p>
              <p className="text-sm mt-1">Ask questions about your uploaded documents</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant avatar */}
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 mr-3 mt-1">
                <div className="w-8 h-8 rounded-full bg-cortex-blue-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cortex-blue-400" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-cortex-dark-700 rounded-2xl rounded-br-sm px-4 py-3'
                  : 'bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl rounded-bl-sm px-4 py-3'
              }`}
            >
              {/* Message content */}
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-gray-100' : 'text-gray-200'
                }`}
              >
                {message.content.split(/(```[\s\S]*?```)/g).map((part, i) => {
                  if (part.startsWith('```') && part.endsWith('```')) {
                    const code = part.slice(3, -3).replace(/^\w*\n/, '');
                    return (
                      <pre
                        key={i}
                        className="bg-cortex-dark-900 rounded-lg px-3 py-2 my-2 overflow-x-auto text-xs font-mono text-gray-300"
                      >
                        <code>{code}</code>
                      </pre>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>

              {/* Source citations */}
              {message.role === 'assistant' &&
                message.sources &&
                message.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-cortex-dark-700/50 flex flex-wrap gap-1.5">
                    {message.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cortex-dark-900/60 text-[11px] text-gray-400 border border-cortex-dark-700/50"
                      >
                        <FileText className="w-3 h-3" />
                        Source: {source.title || source.documentId?.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* User avatar */}
            {message.role === 'user' && (
              <div className="flex-shrink-0 ml-3 mt-1">
                <div className="w-8 h-8 rounded-full bg-cortex-dark-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 mr-3 mt-1">
              <div className="w-8 h-8 rounded-full bg-cortex-blue-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cortex-blue-400" />
              </div>
            </div>
            <div className="bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cortex-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cortex-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cortex-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-cortex-dark-900 via-cortex-dark-900 to-transparent">
        <form onSubmit={handleSubmit}>
          <div className="bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl flex items-end px-4 py-2 gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your documents..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none outline-none py-1.5 max-h-24 leading-6"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 p-2 rounded-xl bg-cortex-blue-500 text-white hover:bg-cortex-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
