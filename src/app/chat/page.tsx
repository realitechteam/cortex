'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConversationList from '@/components/ConversationList';
import { MessageSquare, Sparkles } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const examplePrompts = [
  'Summarize the key findings across my documents',
  'What are the main themes discussed?',
  'Compare the conclusions between documents',
  'Extract all action items mentioned',
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0); // force remount of ChatInterface

  // Fetch conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    setChatKey((k) => k + 1);
  }

  function handleNewChat() {
    setSelectedId(undefined);
    setChatKey((k) => k + 1);
  }

  async function handleDeleteConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) {
          setSelectedId(undefined);
          setChatKey((k) => k + 1);
        }
      }
    } catch {
      // Silently fail
    }
  }

  function handleConversationCreated(id: string) {
    setSelectedId(id);
    // Refresh the conversations list to pick up the new one
    fetchConversations();
  }

  const showWelcome = !selectedId && conversations.length === 0;

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <div className="w-72 flex-shrink-0 bg-cortex-dark-800/50 border-r border-cortex-dark-700">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {showWelcome ? (
          /* Welcome state */
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cortex-blue-500/10 mb-6">
                <MessageSquare className="w-8 h-8 text-cortex-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Ask questions about your documents
              </h2>
              <p className="text-gray-400 text-sm mb-8">
                Start a conversation to get AI-powered answers based on your uploaded documents.
              </p>

              {/* Example prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Try asking
                </p>
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      handleNewChat();
                      // Small delay to let ChatInterface mount, then we can't
                      // inject input directly — user clicks and starts fresh
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl bg-cortex-dark-800 border border-cortex-dark-700 hover:border-cortex-dark-600 hover:bg-cortex-dark-700 text-sm text-gray-300 hover:text-gray-100 transition-colors group"
                  >
                    <Sparkles className="w-4 h-4 text-cortex-blue-400 flex-shrink-0 group-hover:text-cortex-blue-300" />
                    <span className="truncate">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat interface */
          <ChatInterface
            key={chatKey}
            conversationId={selectedId}
            onConversationCreated={handleConversationCreated}
          />
        )}
      </div>
    </div>
  );
}
