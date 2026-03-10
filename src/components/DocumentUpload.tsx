'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  onUploadComplete: (document: any) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const document = await response.json();
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      onUploadComplete(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-cortex-blue-500 bg-cortex-blue-500/10'
            : 'border-cortex-dark-600 bg-cortex-dark-800/50 hover:border-cortex-dark-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload
          className={`w-8 h-8 mx-auto mb-3 ${
            isDragOver ? 'text-cortex-blue-400' : 'text-cortex-dark-500'
          }`}
        />
        <p className="text-sm font-medium text-cortex-dark-300">
          {isDragOver ? 'Drop your file here' : 'Drag & drop a file, or click to browse'}
        </p>
        <p className="text-xs text-cortex-dark-500 mt-1">
          Supports .txt, .md, .csv, .json
        </p>
      </div>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-cortex-dark-800 rounded-lg px-4 py-3 border border-cortex-dark-700">
          <div className="flex items-center gap-3 min-w-0">
            <File className="w-5 h-5 text-cortex-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-cortex-dark-200 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-cortex-dark-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-cortex-blue-500 hover:bg-cortex-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                className="p-2 rounded-lg text-cortex-dark-500 hover:text-cortex-dark-300 hover:bg-cortex-dark-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
