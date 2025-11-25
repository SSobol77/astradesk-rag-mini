# Database Operations - Quick Reference Card

Quick SQL commands and scripts for common database operations in AstraDesk RAG Mini.

## Connection

```bash
# Connect to local development database
psql -h localhost -U astradesk -d astradesk

# Connect to production (from .env)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Connect via Docker Compose
docker-compose exec postgres psql -U astradesk -d astradesk
```

## Verification & Status

```sql
-- ✓ Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- ✓ Check tables
\dt  -- or: SELECT tablename FROM pg_tables WHERE schemaname='public';

-- ✓ Check indexes
\di  -- or: SELECT indexname, indexdef FROM pg_indexes WHERE tablename='chunks';

-- ✓ Current IVFFlat configuration
SELECT indexdef FROM pg_indexes WHERE indexname = 'idx_chunks_embedding';

-- ✓ Database size
SELECT pg_size_pretty(pg_database_size('astradesk'));

-- ✓ Table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ✓ Index size
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = pg_indexes.indexname
WHERE tablename = 'chunks'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Data Inspection

```sql
-- ✓ Document count
SELECT COUNT(*) as total_docs FROM docs;

-- ✓ Chunk count
SELECT COUNT(*) as total_chunks FROM chunks;

-- ✓ Chunks per document
SELECT doc_id, COUNT(*) as chunk_count 
FROM chunks 
GROUP BY doc_id 
ORDER BY chunk_count DESC;

-- ✓ Average chunk size
SELECT 
    COUNT(*) as total_chunks,
    ROUND(AVG(OCTET_LENGTH(content))::numeric, 0) as avg_chars,
    ROUND(AVG(OCTET_LENGTH(content)/3)::numeric, 0) as avg_tokens,  -- ~3 chars per token
    MAX(OCTET_LENGTH(content)) as max_chars,
    MIN(OCTET_LENGTH(content)) as min_chars
FROM chunks;

-- ✓ Document language distribution
SELECT language, COUNT(*) as doc_count 
FROM docs 
GROUP BY language 
ORDER BY doc_count DESC;

-- ✓ Recent documents
SELECT id, title, language, created_at 
FROM docs 
ORDER BY created_at DESC 
LIMIT 10;

-- ✓ Sample chunks with embedding info
SELECT 
    id, 
    doc_id, 
    SUBSTRING(content, 1, 50) as preview,
    OCTET_LENGTH(content) as size_bytes,
    created_at
FROM chunks 
LIMIT 10;
```

## Performance Analysis

```sql
-- ✓ Query execution plan (IMPORTANT for optimization!)
EXPLAIN ANALYZE
SELECT id, content FROM chunks 
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- ✓ Table statistics (analyze before benchmarking)
ANALYZE chunks;
ANALYZE docs;

-- ✓ Cache hit ratio (should be >99%)
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    ROUND(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) as cache_hit_ratio
FROM pg_statio_user_tables
WHERE relname IN ('chunks', 'docs');

-- ✓ Index efficiency (should be high for idx_chunks_embedding)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_blks_hit,
    idx_blks_read,
    ROUND(100.0 * idx_blks_hit / (idx_blks_hit + idx_blks_read + 1), 2) as hit_ratio
FROM pg_statio_user_indexes
WHERE tablename IN ('chunks', 'docs');

-- ✓ Slow queries (if query logging enabled)
SELECT query, calls, mean_exec_time, max_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Maintenance

```sql
-- ✓ Vacuum (reclaim space, update stats)
VACUUM chunks;
VACUUM docs;

-- ✓ Full vacuum (aggressive, locks table during day)
VACUUM FULL chunks;

-- ✓ Analyze (update table statistics for query planner)
ANALYZE chunks;
ANALYZE docs;

-- ✓ Reindex (rebuild indexes, use CONCURRENTLY for production)
REINDEX INDEX CONCURRENTLY idx_chunks_embedding;
REINDEX INDEX CONCURRENTLY idx_chunks_docid;

-- ✓ Force index usage (if needed for testing)
SET enable_seqscan = off;  -- Disables sequential scans
SELECT ... FROM chunks ... ;
SET enable_seqscan = on;   -- Re-enable sequential scans

-- ✓ Check for bloat (dead rows taking space)
SELECT 
    schemaname,
    tablename,
    ROUND(100 * n_dead_tup / (n_live_tup + n_dead_tup + 1), 2) as pct_dead
FROM pg_stat_user_tables
WHERE tablename IN ('chunks', 'docs')
ORDER BY pct_dead DESC;
```

## Index Tuning

```sql
-- ✓ Current IVFFlat lists value
SELECT indexdef FROM pg_indexes 
WHERE indexname = 'idx_chunks_embedding';
-- Look for: WITH (lists = 100)

-- ✓ Recommended lists value (formula)
SELECT 
    COUNT(*) as chunk_count,
    SQRT(COUNT(*) / 10.0)::integer as recommended_lists
FROM chunks;

-- ✓ Rebuild index with new lists value (REQUIRES MAINTENANCE WINDOW)
-- Step 1: Drop old index
DROP INDEX idx_chunks_embedding;

-- Step 2: Create new index with new lists parameter
CREATE INDEX idx_chunks_embedding ON chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 300);  -- Adjust to your recommended value

-- Step 3: Analyze for query optimization
ANALYZE chunks;

-- Or use automated script: ./scripts/migrate-ivfflat-lists.sh 300
```

## Backup & Recovery

```bash
# Backup entire database
pg_dump -U astradesk -d astradesk | gzip > backup_full_$(date +%Y%m%d).sql.gz

# Backup just chunks table
pg_dump -U astradesk -d astradesk --table=chunks | gzip > chunks_backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c backup_full_20250124.sql.gz | psql -U astradesk -d astradesk

# Restore specific table
gunzip -c chunks_backup_20250124.sql.gz | psql -U astradesk -d astradesk
```

## Debugging Common Issues

```sql
-- ✗ Vector dimension mismatch error?
-- Check schema: dimension must match embedding model output
SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'chunks' AND column_name = 'embedding';
-- Should show: "1536" for text-embedding-3-small

-- ✗ Slow vector searches (>100ms)?
-- 1. Check if using sequential scan instead of index
EXPLAIN ANALYZE SELECT ... ORDER BY embedding <=> query LIMIT 10;

-- 2. Rebuild index with more lists for accuracy vs speed trade-off
-- See: "Index Tuning" section above

-- 3. Increase work_mem for sorting (requires postgres restart)
-- In postgresql.conf: work_mem = '256MB'

-- ✗ High memory usage?
-- Check current settings:
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;

-- ✗ Fragmented tables/indexes?
SELECT 
    schemaname,
    tablename,
    ROUND(100 * (pg_relation_size(schemaname||'.'||tablename) - 
           pg_relation_size(schemaname||'.'||tablename, 'main')) / 
           pg_relation_size(schemaname||'.'||tablename), 2) as bloat_ratio
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('chunks', 'docs');
-- If > 20%, run: VACUUM FULL table_name;
```

## Performance Benchmarking

```bash
#!/bin/bash
# Benchmark vector search performance

# Generate sample vectors (replace with actual queries)
psql -U astradesk -d astradesk << 'EOF'
\timing on

-- Warm up cache
SELECT COUNT(*) FROM chunks ORDER BY embedding <=> 
  (SELECT embedding FROM chunks LIMIT 1) LIMIT 10;

-- Benchmark 1: Simple vector search
SELECT COUNT(*) FROM chunks ORDER BY embedding <=> 
  (SELECT embedding FROM chunks OFFSET 1000 LIMIT 1) LIMIT 10;

-- Benchmark 2: Search with pre-filtering
SELECT COUNT(*) FROM chunks 
WHERE doc_id IN (SELECT id FROM docs WHERE language = 'en')
ORDER BY embedding <=> 
  (SELECT embedding FROM chunks OFFSET 2000 LIMIT 1) LIMIT 10;

-- Benchmark 3: Multiple searches (measure consistency)
EXPLAIN ANALYZE
SELECT id FROM chunks ORDER BY embedding <=> 
  (SELECT embedding FROM chunks OFFSET 3000 LIMIT 1) LIMIT 10;

EOF
```

## Monitoring with Docker

```bash
# Connect to database container
docker-compose exec postgres bash

# Inside container:
psql -U astradesk -d astradesk

# Monitor queries in real-time (if pg_stat_statements extension loaded)
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;

# Monitor connections
SELECT usename, count(*) as connections 
FROM pg_stat_activity 
GROUP BY usename;
```

## Settings Reference

### Recommended for Production

```sql
-- In postgresql.conf (restart required)

-- Memory settings (adjust based on available RAM)
shared_buffers = 256MB              # 25% of system RAM
effective_cache_size = 1GB          # 75% of system RAM
work_mem = 256MB                    # Per query sort/hash

-- Connection settings
max_connections = 100
max_parallel_workers_per_gather = 4

-- Query planning
random_page_cost = 1.1              # For SSD

-- Maintenance
maintenance_work_mem = 2GB
autovacuum = on
```

### Monitoring Configuration

```yaml
# In application.yml (Java Spring Boot)
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 100
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 10000
      max-lifetime: 30000

management:
  metrics:
    database:
      enabled: true
```


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
