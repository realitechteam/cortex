'use client';

import { useState } from 'react';
import { FileText, Trash2, Clock, ChevronRight, Loader2 } from 'lucide-react';

export interface Document {
  id: string;
  title: string;
  filename: string;
  content: string;
  file_size: number;
  mime_type: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onSelect: (doc: Document) => void;
  selectedId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocumentList({
  documents,
  onDelete,
  onSelect,
  selectedId,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    onDelete(id);
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const isSelected = doc.id === selectedId;
        const isDeleting = doc.id === deletingId;

        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc)}
            disabled={isDeleting}
            className={`text-left bg-cortex-dark-800 rounded-xl p-4 border transition-all group ${
              isSelected
                ? 'ring-2 ring-cortex-blue-500 border-cortex-blue-500/50'
                : 'border-cortex-dark-700 hover:border-cortex-dark-600 hover:bg-cortex-dark-750'
            } ${isDeleting ? 'opacity-50' : ''}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-cortex-blue-400 flex-shrink-0 mt-0.5" />
                <h3 className="text-sm font-semibold text-cortex-dark-100 truncate">
                  {doc.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-cortex-dark-500 animate-spin" />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(e, doc.id, doc.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDelete(e as any, doc.id, doc.title);
                      }
                    }}
                    className="p-1 rounded-md text-cortex-dark-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 mb-3 text-xs text-cortex-dark-500">
              <span className="truncate">{doc.filename}</span>
              <span className="flex-shrink-0">·</span>
              <span className="flex-shrink-0">{formatFileSize(doc.file_size)}</span>
            </div>

            {/* Summary */}
            <p className="text-xs text-cortex-dark-400 line-clamp-3 mb-3 min-h-[3rem]">
              {doc.summary ? (
                doc.summary.slice(0, 150) + (doc.summary.length > 150 ? '…' : '')
              ) : (
                <span className="flex items-center gap-1.5 text-cortex-dark-500 italic">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating summary…
                </span>
              )}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-cortex-dark-700">
              <span className="flex items-center gap-1 text-xs text-cortex-dark-500">
                <Clock className="w-3 h-3" />
                {formatDate(doc.created_at)}
              </span>
              <ChevronRight
                className={`w-4 h-4 transition-colors ${
                  isSelected ? 'text-cortex-blue-400' : 'text-cortex-dark-600 group-hover:text-cortex-dark-400'
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
