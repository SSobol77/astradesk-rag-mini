-- src/main/resources/schema.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS docs (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  language   TEXT,                 -- ISO language code (detected)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
  id          BIGSERIAL PRIMARY KEY,
  doc_id      BIGINT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_from   INT,
  page_to     INT,
  source_key  TEXT,                -- путь ключа в S3/MinIO
  content     TEXT NOT NULL,
  embedding   VECTOR(1536) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_docid ON chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);