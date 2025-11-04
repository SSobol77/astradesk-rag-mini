"use client";

import React, { useRef, useState } from "react";
import type { IngestParams } from "@/lib/rag-api.types";
import { useRagIngest } from "@/hooks/use-rag";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Trash2,
} from "lucide-react";

interface IngestPanelProps {
  onSuccess?: () => void;
  defaultCollection?: string;
}

/**
 * Professional RAG document ingestion component
 *
 * Features:
 * - Drag & drop ZIP file upload
 * - Configurable chunk parameters
 * - Real-time progress tracking
 * - Error handling
 * - Success confirmation
 */
export function IngestPanel({
  onSuccess,
  defaultCollection = "default",
}: IngestPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [collection, setCollection] = useState(defaultCollection);
  const [maxLen, setMaxLen] = useState(1200);
  const [overlap, setOverlap] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  const { ingest, isLoading, progress, error, progressPercent, reset } = useRagIngest();

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".zip")) {
      alert("Please select a ZIP file");
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await ingest(selectedFile, {
        collection,
        maxLen,
        overlap,
      });

      setSelectedFile(null);
      onSuccess?.();
    } catch (err) {
      console.error("Ingestion failed:", err);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDone = progress.stage === "DONE";
  const hasError = progress.stage === "ERROR" || error;

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      {!isLoading && !isDone && (
        <Card
          className={`border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <Upload className="mx-auto h-10 w-10 text-gray-400" />

            {selectedFile ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your ZIP file here
                </p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Browse files
            </button>
          </div>
        </Card>
      )}

      {/* Configuration */}
      {selectedFile && !isLoading && !isDone && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Ingestion Settings</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Collection Name</label>
              <Input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="e.g., documentation"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Group related documents by collection
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Chunk Length</label>
                <Input
                  type="number"
                  value={maxLen}
                  onChange={(e) => setMaxLen(Math.max(100, parseInt(e.target.value)))}
                  min={100}
                  max={5000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Characters per chunk</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Overlap</label>
                <Input
                  type="number"
                  value={overlap}
                  onChange={(e) => setOverlap(Math.max(0, parseInt(e.target.value)))}
                  min={0}
                  max={1000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Character overlap</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Bar */}
      {isLoading && (
        <ProgressTracker progress={progress} progressPercent={progressPercent} />
      )}

      {/* Success Message */}
      {isDone && (
        <Card className="border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Ingestion Complete</h3>
              <p className="text-sm text-green-700 mt-1">
                Successfully indexed {progress.total} chunks from {progress.file}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {hasError && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Ingestion Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {error || progress.error || "An error occurred during ingestion"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading || isDone}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isDone ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Index
            </>
          )}
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          disabled={isLoading}
          className="px-4"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200 p-4">
        <p className="text-xs text-blue-900">
          <strong>Supported formats:</strong> PDF, HTML, Markdown, TXT, DOCX •{" "}
          <strong>Max size:</strong> 1GB • <strong>Recommended:</strong> maxLen=1200,
          overlap=200
        </p>
      </Card>
    </div>
  );
}

interface ProgressTrackerProps {
  progress: any;
  progressPercent: number;
}

function ProgressTracker({ progress, progressPercent }: ProgressTrackerProps) {
  const stageDescriptions: Record<string, string> = {
    RECEIVED: "Received ZIP file",
    PROCESSING: "Extracting and processing documents",
    INDEXED: "Embedding and indexing chunks",
    DONE: "Complete",
    ERROR: "Error occurred",
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Stage Badge */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {stageDescriptions[progress.stage] || progress.stage}
          </p>
          {progress.file && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {progress.file}
            </p>
          )}
        </div>
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{Math.round(progressPercent)}%</span>
          {progress.processed && progress.total && (
            <span>
              {progress.processed} / {progress.total} chunks
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700">{progress.message}</p>
    </Card>
  );
}