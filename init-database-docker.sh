#!/bin/bash
# Docker Database Initialization Script
# Usage: ./init-database-docker.sh [container_name]

CONTAINER="${1:-rag-db}"

echo "🗄️  Initializing Database in Docker Container: $CONTAINER"
echo ""

docker exec -i "$CONTAINER" psql -U rag -d rag <<'EOF'
-- Drop existing tables
DROP TABLE IF EXISTS chunks CASCADE;
DROP TABLE IF EXISTS docs CASCADE;

-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE docs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks table with vector embeddings
CREATE TABLE chunks (
  id BIGSERIAL PRIMARY KEY,
  doc_id BIGINT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_from INT,
  page_to INT,
  source_key TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chunks_docid ON chunks(doc_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Verify
\dt
SELECT 'docs' as table_name, COUNT(*) as rows FROM docs
UNION ALL
SELECT 'chunks' as table_name, COUNT(*) as rows FROM chunks;
EOF

echo ""
echo "✅ Database initialized!"
echo ""
echo "Restart app: docker restart rag-app"
