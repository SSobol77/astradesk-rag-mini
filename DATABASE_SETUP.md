# Database Setup Guide

## Quick Start Scripts

### 1. Docker Environment (Recommended)

```bash
# Initialize database in Docker container
./init-database-docker.sh rag-db

# Restart application
docker restart rag-app
```

### 2. Production/Remote Database

```bash
# Set password
export PGPASSWORD='your_password'

# Run initialization
./init-database.sh hostname 5432 rag rag_user
```

---

## Manual Setup

### Using Docker

```bash
docker exec -i rag-db psql -U rag -d rag <<'EOF'
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE docs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE INDEX idx_chunks_docid ON chunks(doc_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EOF
```

### Using psql Client

```bash
export PGPASSWORD='rag'
psql -h localhost -p 5432 -U rag -d rag -f src/main/resources/schema.sql
```

---

## Schema Details

### Tables

#### `docs` - Document Metadata
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| title | TEXT | Document filename |
| language | TEXT | Auto-detected language (ENGLISH, POLISH, etc.) |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `chunks` - Document Chunks with Embeddings
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| doc_id | BIGINT | Foreign key to docs |
| chunk_index | INT | Chunk sequence number |
| page_from | INT | Starting page (PDF only) |
| page_to | INT | Ending page (PDF only) |
| source_key | TEXT | S3/MinIO object key |
| content | TEXT | Chunk text content |
| embedding | VECTOR(1536) | Vector embedding |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Indexes

- `idx_chunks_docid` - B-tree index on doc_id for fast lookups
- `idx_chunks_embedding` - IVFFlat index for vector similarity search

---

## Verification

```bash
# Check tables exist
docker exec rag-db psql -U rag -d rag -c "\dt"

# Check row counts
docker exec rag-db psql -U rag -d rag -c "
SELECT 'docs' as table_name, COUNT(*) as rows FROM docs
UNION ALL
SELECT 'chunks' as table_name, COUNT(*) as rows FROM chunks;"

# Check indexes
docker exec rag-db psql -U rag -d rag -c "\di"
```

---

## Troubleshooting

### pgvector Extension Missing

```bash
docker exec rag-db psql -U rag -d rag -c "CREATE EXTENSION vector;"
```

### Connection Refused

```bash
# Check if database is running
docker ps | grep rag-db

# Check if database is ready
docker exec rag-db pg_isready -U rag

# Restart database
docker restart rag-db
```

### Index Warning: "little data"

This is normal for empty tables. The warning disappears after ingesting documents.

---

## Production Recommendations

### 1. Tune IVFFlat Index

```sql
-- For small datasets (<10k chunks)
CREATE INDEX idx_chunks_embedding ON chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- For medium datasets (10k-100k chunks)
CREATE INDEX idx_chunks_embedding ON chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- For large datasets (>100k chunks)
CREATE INDEX idx_chunks_embedding ON chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 300);
```

### 2. Add Constraints

```sql
ALTER TABLE chunks ADD CONSTRAINT chunks_chunk_index_check CHECK (chunk_index >= 0);
ALTER TABLE chunks ADD CONSTRAINT chunks_page_check CHECK (page_from IS NULL OR page_from > 0);
```

### 3. Enable Query Logging

```sql
ALTER DATABASE rag SET log_statement = 'all';
ALTER DATABASE rag SET log_duration = on;
```

---

**Author**: Cartesian School - Siergiej Sobolewski  
**Last Updated**: 2025-01-24
