"use client";

import React from "react";
import type { ChunkResult } from "@/lib/rag-api.types";
import { Badge } from "@/components/primitives/badge";
import { Card } from "@/components/primitives/card";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface SearchResultsProps {
  results: ChunkResult[];
  isLoading?: boolean;
  error?: string | null;
  onSelect?: (chunk: ChunkResult) => void;
}

export function SearchResults({ results, isLoading, error, onSelect }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Search Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Found <strong>{results.length}</strong> relevant chunks
      </p>
      {results.map((chunk, index) => (
        <SearchResultCard
          key={chunk.id}
          chunk={chunk}
          rank={index + 1}
          onClick={() => onSelect?.(chunk)}
        />
      ))}
    </div>
  );
}

interface SearchResultCardProps {
  chunk: ChunkResult;
  rank: number;
  onClick?: () => void;
}

function SearchResultCard({ chunk, rank, onClick }: SearchResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scorePercent = Math.round(chunk.score * 100);
  const scoreColor =
    scorePercent >= 90
      ? "bg-green-100 text-green-800"
      : scorePercent >= 75
        ? "bg-blue-100 text-blue-800"
        : "bg-yellow-100 text-yellow-800";

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">
                Document #{chunk.docId} • Chunk #{chunk.chunkIndex}
                {chunk.pageFrom && ` • Page ${chunk.pageFrom}${chunk.pageTo && chunk.pageTo !== chunk.pageFrom ? `-${chunk.pageTo}` : ""}`}
              </p>
              <p className="text-sm line-clamp-3 text-gray-900 leading-relaxed">
                {chunk.content}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Badge variant="secondary" className={scoreColor}>
              {scorePercent}% relevance
            </Badge>

            <div className="flex-1" />

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              title="Copy content to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SearchResultDetail({ chunk }: { chunk: ChunkResult | null }) {
  if (!chunk) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Full Content</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{chunk.content}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Document ID</p>
          <p className="text-sm text-gray-900 mt-1">{chunk.docId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Chunk Index</p>
          <p className="text-sm text-gray-900 mt-1">{chunk.chunkIndex}</p>
        </div>
        {chunk.pageFrom && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Page Range</p>
            <p className="text-sm text-gray-900 mt-1">
              {chunk.pageFrom}
              {chunk.pageTo && chunk.pageTo !== chunk.pageFrom ? `-${chunk.pageTo}` : ""}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Relevance Score</p>
          <p className="text-sm text-gray-900 mt-1">
            {(chunk.score * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}