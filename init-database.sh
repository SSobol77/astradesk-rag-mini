#!/bin/bash
# Production Database Initialization Script for AstraDesk RAG Mini
# Usage: ./init-database.sh [host] [port] [database] [user]

set -e

# Configuration
DB_HOST="${1:-localhost}"
DB_PORT="${2:-5432}"
DB_NAME="${3:-rag}"
DB_USER="${4:-rag}"

echo "🗄️  Initializing AstraDesk RAG Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Host:     $DB_HOST"
echo "Port:     $DB_PORT"
echo "Database: $DB_NAME"
echo "User:     $DB_USER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Install postgresql-client:"
    echo "   Ubuntu/Debian: sudo apt install postgresql-client"
    echo "   macOS: brew install postgresql"
    exit 1
fi

# Test connection
echo "🔌 Testing connection..."
if ! PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Connection failed. Set PGPASSWORD environment variable:"
    echo "   export PGPASSWORD='your_password'"
    exit 1
fi
echo "✅ Connected"
echo ""

# Create pgvector extension
echo "📦 Installing pgvector extension..."
PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
CREATE EXTENSION IF NOT EXISTS vector;
EOF
echo "✅ pgvector installed"
echo ""

# Create tables
echo "📋 Creating tables..."
PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'

-- Drop existing tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS chunks CASCADE;
DROP TABLE IF EXISTS docs CASCADE;

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

-- Performance indexes
CREATE INDEX idx_chunks_docid ON chunks(doc_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Comments for documentation
COMMENT ON TABLE docs IS 'Document metadata';
COMMENT ON TABLE chunks IS 'Document chunks with vector embeddings';
COMMENT ON COLUMN docs.language IS 'Auto-detected language (e.g., ENGLISH, POLISH)';
COMMENT ON COLUMN chunks.embedding IS '1536-dimensional vector from text-embedding-3-small';
COMMENT ON COLUMN chunks.source_key IS 'S3/MinIO object key for original file';

EOF
echo "✅ Tables created"
echo ""

# Verify schema
echo "🔍 Verifying schema..."
PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
\dt
SELECT 
  'docs' as table_name, 
  COUNT(*) as row_count 
FROM docs
UNION ALL
SELECT 
  'chunks' as table_name, 
  COUNT(*) as row_count 
FROM chunks;
EOF
echo ""

# Show table details
echo "📊 Table structure:"
PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
\d+ docs
\d+ chunks
EOF
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Database initialized successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "   1. Start application: ./gradlew bootRun"
echo "   2. Test health: curl http://localhost:8080/api/v1/health"
echo "   3. Ingest documents: curl -X POST -F 'file=@docs.zip' http://localhost:8080/api/v1/ingest/zip"
echo ""
