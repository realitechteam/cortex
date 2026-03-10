'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  RefreshCw,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  type: string;
  summary?: string;
  created_at: string;
}

export default function InsightsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedDocs, setAnalyzedDocs] = useState<Document[]>([]);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load documents'
        );
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, []);

  const docsWithSummaries = documents.filter(
    (doc) => doc.summary && doc.summary.trim().length > 0
  );

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    setInsights(null);

    try {
      const payload = docsWithSummaries.map((doc) => ({
        title: doc.title,
        summary: doc.summary!,
      }));

      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: payload }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
      setAnalyzedDocs(docsWithSummaries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate insights'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const hasEnoughDocs = docsWithSummaries.length >= 2;

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-cortex-dark-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Lightbulb className="w-6 h-6 text-cortex-blue-400" />
              Cross-Document Insights
            </h1>
            <p className="text-sm text-cortex-dark-400 mt-1">
              AI-powered analysis across your document library
            </p>
          </div>

          {!isLoadingDocs && (
            <div className="text-right">
              <p className="text-xs text-cortex-dark-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''}{' '}
                in library
              </p>
              <p className="text-xs text-cortex-dark-400 font-medium">
                {docsWithSummaries.length} with summaries
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-8 scrollbar-thin">
        {/* Loading state */}
        {isLoadingDocs && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-cortex-dark-400">
              <div className="w-5 h-5 border-2 border-cortex-dark-600 border-t-cortex-blue-400 rounded-full animate-spin" />
              <span className="text-sm">Loading documents…</span>
            </div>
          </div>
        )}

        {/* Not enough documents */}
        {!isLoadingDocs && !hasEnoughDocs && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cortex-dark-800 border border-cortex-dark-700 mb-4">
              <AlertCircle className="w-8 h-8 text-cortex-dark-600" />
            </div>
            <h3 className="text-lg font-semibold text-cortex-dark-300 mb-2">
              More documents needed
            </h3>
            <p className="text-sm text-cortex-dark-500 max-w-md mb-6">
              Upload at least 2 documents with generated summaries to unlock
              cross-document insights. Cortex will analyze patterns,
              connections, and themes across your library.
            </p>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cortex-blue-500 hover:bg-cortex-blue-600 text-white font-semibold text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              Go to Documents
            </Link>
          </div>
        )}

        {/* Ready to generate */}
        {!isLoadingDocs && hasEnoughDocs && (
          <div className="space-y-8">
            {/* Generate button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cortex-blue-500 hover:bg-cortex-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-cortex-blue-500/25 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing {docsWithSummaries.length} documents…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Insights
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Failed to generate insights</p>
                  <p className="text-red-400/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Insights result */}
            {insights && (
              <div className="space-y-4">
                {/* Document chips */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-cortex-dark-500 uppercase tracking-wider">
                    Documents Analyzed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analyzedDocs.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cortex-dark-800 border border-cortex-dark-700 text-xs text-cortex-dark-300 font-medium"
                      >
                        <FileText className="w-3 h-3 text-cortex-blue-400" />
                        {doc.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Insights content */}
                <div className="bg-cortex-dark-800 border border-cortex-dark-700 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-cortex-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Insights
                    </h3>
                  </div>
                  <div className="text-sm text-cortex-dark-300 leading-relaxed whitespace-pre-wrap">
                    {insights}
                  </div>
                </div>
              </div>
            )}

            {/* Empty / initial state */}
            {!insights && !isGenerating && !error && (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cortex-dark-800 border border-cortex-dark-700 mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-cortex-dark-600" />
                </div>
                <h3 className="text-lg font-semibold text-cortex-dark-300 mb-1">
                  Ready to analyze
                </h3>
                <p className="text-sm text-cortex-dark-500 max-w-md mx-auto">
                  Click &ldquo;Generate Insights&rdquo; to discover patterns,
                  connections, and themes across your{' '}
                  {docsWithSummaries.length} documents.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
