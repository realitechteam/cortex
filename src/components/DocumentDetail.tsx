'use client';

import { useState } from 'react';
import { FileText, RefreshCw, Calendar, HardDrive, Loader2 } from 'lucide-react';

interface DocumentDetailProps {
  document: any;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DocumentDetail({ document }: DocumentDetailProps) {
  const [summary, setSummary] = useState<string | null>(document.summary);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${document.id}/summary`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="bg-cortex-dark-800 rounded-xl border border-cortex-dark-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-cortex-dark-700">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cortex-blue-500/15 flex-shrink-0">
            <FileText className="w-5 h-5 text-cortex-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {document.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-cortex-dark-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {document.filename}
              </span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3" />
                {formatFileSize(document.file_size)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {formatDate(document.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary section */}
      <div className="px-6 py-4 border-b border-cortex-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-cortex-dark-300">Summary</h3>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs font-medium text-cortex-blue-400 hover:text-cortex-blue-300 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-md hover:bg-cortex-blue-500/10"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-xs mb-2">
            {error}
          </div>
        )}

        {summary ? (
          <p className="text-sm text-cortex-dark-300 leading-relaxed">
            {summary}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-cortex-dark-500 italic">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Generating summary…
          </div>
        )}
      </div>

      {/* Content preview */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-medium text-cortex-dark-300 mb-2">Content Preview</h3>
        <div className="max-h-96 overflow-auto rounded-lg bg-cortex-dark-900 border border-cortex-dark-700 p-4 scrollbar-thin">
          <pre className="text-xs text-cortex-dark-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {document.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
