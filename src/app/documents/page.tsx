'use client';

import { useState, useEffect } from 'react';
import { FileText, Upload as UploadIcon } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import DocumentDetail from '@/components/DocumentDetail';
import type { Document } from '@/components/DocumentList';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleUploadComplete = (document: Document) => {
    setDocuments((prev) => [document, ...prev]);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document');
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));

      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSelect = (doc: Document) => {
    setSelectedDoc((prev) => (prev?.id === doc.id ? null : doc));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-cortex-dark-700 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="text-sm text-cortex-dark-400 mt-1">
          Upload and manage your document library
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-8">
        {/* Upload section */}
        <section>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-cortex-dark-400">
              <div className="w-5 h-5 border-2 border-cortex-dark-600 border-t-cortex-blue-400 rounded-full animate-spin" />
              <span className="text-sm">Loading documents…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cortex-dark-800 border border-cortex-dark-700 mb-4">
              <FileText className="w-8 h-8 text-cortex-dark-600" />
            </div>
            <h3 className="text-lg font-semibold text-cortex-dark-300 mb-1">
              No documents yet
            </h3>
            <p className="text-sm text-cortex-dark-500 max-w-sm">
              Upload your first document above to get started. Cortex will
              automatically generate summaries and make your documents
              searchable.
            </p>
          </div>
        )}

        {/* Document list & detail */}
        {!isLoading && documents.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-cortex-dark-400 uppercase tracking-wider">
                Your Documents
              </h2>
              <span className="text-xs text-cortex-dark-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              onSelect={handleSelect}
              selectedId={selectedDoc?.id}
            />

            {/* Document detail panel */}
            {selectedDoc && (
              <div className="mt-6">
                <DocumentDetail
                  key={selectedDoc.id}
                  document={selectedDoc}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
