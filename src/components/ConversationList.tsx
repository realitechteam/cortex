'use client';

import { MessageSquare, Plus, Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Chat button */}
      <div className="px-3 py-4 border-b border-cortex-dark-700">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cortex-blue-500 hover:bg-cortex-blue-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {conversations.length === 0 && (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-xs text-gray-500">No conversations yet</p>
          </div>
        )}

        {conversations.map((conv) => {
          const isSelected = conv.id === selectedId;

          return (
            <div
              key={conv.id}
              className="group relative"
            >
              <button
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-cortex-blue-500/20 text-cortex-blue-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-cortex-dark-700/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-[13px] leading-snug">
                    {conv.title || 'New Conversation'}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {formatDate(conv.created_at)}
                  </p>
                </div>
              </button>

              {/* Delete button — visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
