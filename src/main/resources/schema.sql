-- src/main/resources/schema.sql
-- AstraDesk RAG Mini Database Schema
-- PostgreSQL 16+ with pgvector extension for vector embeddings

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- pgvector extension: Adds vector data type and similarity search operators
-- Version: 0.1.6+
-- Required for: Vector embeddings storage and approximate nearest neighbor (ANN) search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS docs (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  language   TEXT,                 -- ISO 639-1 language code (auto-detected by ZipIngestService)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CHUNKS TABLE
-- ============================================================================
-- Stores semantic chunks of documents with vector embeddings
-- Each chunk represents a portion of a document, with overlapping text for context
CREATE TABLE IF NOT EXISTS chunks (
  id          BIGSERIAL PRIMARY KEY,
  doc_id      BIGINT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,        -- Order of chunk within document
  page_from   INT,                 -- Original page number (for PDFs)
  page_to     INT,                 -- Original page number (for PDFs)
  source_key  TEXT,                -- S3/MinIO storage key for source document
  content     TEXT NOT NULL,       -- Semantic text chunk (split by Chunker with sentence/word boundaries)
  -- EMBEDDING VECTOR CONFIG:
  -- - Model: OpenAI text-embedding-3-small
  -- - Dimension: 1536
  -- - Distance metric: Cosine similarity (normalized vectors)
  -- - For different models, update dimension and rebuild indexes:
  --   text-embedding-3-large: VECTOR(3072)
  embedding   VECTOR(1536) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Standard B-tree index on doc_id for efficient document lookups
CREATE INDEX IF NOT EXISTS idx_chunks_docid ON chunks(doc_id);

-- ============================================================================
-- IVFFlat Vector Index (APPROXIMATE NEAREST NEIGHBOR SEARCH)
-- ============================================================================
-- IVFFlat (Inverted File Flat) algorithm for fast vector similarity search
-- 
-- TUNING GUIDE - lists parameter by dataset size:
-- ┌──────────────────┬────────────┬──────────────────┬───────────────┐
-- │ Dataset Size     │ Doc Count  │ Recommended Lists│ Query Latency │
-- ├──────────────────┼────────────┼──────────────────┼───────────────┤
-- │ Tiny (<1K docs)  │ < 1K       │ Sequential scan  │ <1ms          │
-- │ Small (1-10K)    │ 1K-10K     │ 10-50            │ 0.5-2ms       │
-- │ Medium (10-100K) │ 10K-100K   │ 50-200           │ 2-10ms        │
-- │ Standard (100K+) │ 100K-1M    │ 100-500 ✓ (100)  │ 10-50ms       │
-- │ Large (1M+)      │ 1M-10M     │ 500-2000         │ 50-200ms      │
-- │ Massive (10M+)   │ > 10M      │ 2000-5000        │ 200ms+        │
-- └──────────────────┴────────────┴──────────────────┴───────────────┘
--
-- Formula: lists = MAX(1, SQRT(total_chunks / 10))
--   - 100K chunks  → lists ≈ 100 (default) ✓
--   - 1M chunks    → lists ≈ 300-500 (adjust with: ALTER INDEX ... SET (lists = X))
--
-- Performance Characteristics:
-- - Higher lists = slower search, more accurate results
-- - Lower lists = faster search, potential false negatives
-- - Default (100) optimized for 100k-1M total vectors
--
-- To MODIFY after deployment:
-- 1. DROP INDEX idx_chunks_embedding;
-- 2. CREATE INDEX idx_chunks_embedding ... WITH (lists = NEW_VALUE);
-- 3. ANALYZE chunks;
--
-- Distance Metric: vector_cosine_ops (cosine similarity, normalized vectors)
-- Alternative operators: vector_l2_ops (Euclidean), vector_ip_ops (inner product)
--
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This schema is auto-applied by Spring Boot on startup via spring.jpa.hibernate.ddl-auto=update
-- 
-- To change embedding dimensions (e.g., switch to text-embedding-3-large):
-- 1. Update schema.sql: VECTOR(1536) → VECTOR(3072)
-- 2. Update ProviderConfig.java: model name change
-- 3. Truncate chunks table (clear old embeddings)
-- 4. Re-ingest documents with new model
-- 
-- For zero-downtime migrations on large datasets:
-- 1. Create new chunks_v2 table with new vector dimension
-- 2. Migrate data with batched INSERT SELECT
-- 3. Drop old index and table
-- 4. Rename chunks_v2 to chunks
-- See docs/DATABASE_TUNING_GUIDE.md for detailed migration scripts