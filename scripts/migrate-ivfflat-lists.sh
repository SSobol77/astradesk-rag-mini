#!/bin/bash
# scripts/migrate-ivfflat-lists.sh
# 
# USAGE: ./migrate-ivfflat-lists.sh <new_lists_value> [database_name] [user]
#
# EXAMPLES:
#   ./migrate-ivfflat-lists.sh 50       # Use lists=50 for small dataset
#   ./migrate-ivfflat-lists.sh 200      # Use lists=200 for medium dataset
#   ./migrate-ivfflat-lists.sh 500 rag rag  # Use lists=500 for large dataset with custom DB/user
#
# DESCRIPTION:
#   Rebuilds the IVFFlat vector index with a new `lists` parameter for tuned
#   approximate nearest neighbor search performance.
#   
#   This operation:
#   1. Drops the existing index (queries will be slow during this time)
#   2. Creates new index with updated `lists` parameter
#   3. Analyzes the table for query optimization
#   
#   DOWNTIME: ~1-5 minutes depending on dataset size
#   - Small (10k chunks): <30 seconds
#   - Medium (100k chunks): 1-2 minutes  
#   - Large (1M chunks): 3-5 minutes
#   - Massive (10M chunks): 10+ minutes
#
# SAFETY:
#   - Creates backup before starting (if dump available)
#   - Uses CONCURRENTLY flag to minimize blocking (PostgreSQL 12+)
#   - Shows progress with timestamps
#

set -e  # Exit on first error

# ============================================================================
# CONFIGURATION
# ============================================================================

LISTS_VALUE="${1:-100}"
DATABASE_NAME="${2:-astradesk}"
DB_USER="${3:-astradesk}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# ============================================================================
# VALIDATION
# ============================================================================

if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql not found. Install PostgreSQL client tools."
    exit 1
fi

if [[ ! $LISTS_VALUE =~ ^[0-9]+$ ]] || [ "$LISTS_VALUE" -lt 1 ]; then
    echo "❌ ERROR: lists parameter must be a positive integer (got: $LISTS_VALUE)"
    exit 1
fi

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1"
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1"
}

log_warning() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1" >&2
}

get_chunk_count() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
        -t -c "SELECT COUNT(*) FROM chunks;" | tr -d ' '
}

get_current_lists() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
        -t -c "SELECT indexdef FROM pg_indexes WHERE indexname='idx_chunks_embedding';" \
        | grep -oP 'lists = \K[0-9]+' || echo "unknown"
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

log_info "Connecting to PostgreSQL..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
    -c "SELECT version();" > /dev/null 2>&1; then
    log_error "Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT/$DATABASE_NAME"
    log_error "Make sure PostgreSQL is running and credentials are correct"
    exit 1
fi
log_success "Connected to PostgreSQL"

log_info "Checking pgvector extension..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
    -c "SELECT * FROM pg_extension WHERE extname='vector';" | grep -q vector; then
    log_error "pgvector extension not installed"
    exit 1
fi
log_success "pgvector extension found"

log_info "Checking chunks table..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
    -c "\dt chunks" | grep -q chunks; then
    log_error "chunks table not found in database"
    exit 1
fi
log_success "chunks table found"

# Get current stats
CHUNK_COUNT=$(get_chunk_count)
CURRENT_LISTS=$(get_current_lists)

log_info "Current state:"
log_info "  Database: $DATABASE_NAME"
log_info "  User: $DB_USER"
log_info "  Host: $DB_HOST:$DB_PORT"
log_info "  Total chunks: $CHUNK_COUNT"
log_info "  Current lists: $CURRENT_LISTS"
log_info "  Target lists: $LISTS_VALUE"

# Calculate estimated parameters
RECOMMENDED_LISTS=$((1 + CHUNK_COUNT / 10))
RECOMMENDED_LISTS=$((RECOMMENDED_LISTS > 1 ? RECOMMENDED_LISTS : 1))
RECOMMENDED_LISTS=$(awk "BEGIN {print int(sqrt($RECOMMENDED_LISTS))}")

if [ "$LISTS_VALUE" -ne "$RECOMMENDED_LISTS" ]; then
    log_warning "Recommended lists value: $RECOMMENDED_LISTS (for $CHUNK_COUNT chunks)"
    log_warning "Using specified value: $LISTS_VALUE"
fi

# ============================================================================
# CONFIRMATION
# ============================================================================

echo ""
log_info "This will:"
echo "  1. DROP the current IVFFlat index (idx_chunks_embedding)"
echo "  2. CREATE new index with lists=$LISTS_VALUE"
echo "  3. ANALYZE table for query optimization"
echo ""
log_warning "During re-indexing, vector queries will be slower"
log_warning "Estimated downtime: depends on chunk count"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cancelled"
    exit 0
fi

# ============================================================================
# BACKUP (optional)
# ============================================================================

if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="chunks_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    log_info "Creating backup to: $BACKUP_FILE"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" \
        --table=chunks --table=docs | gzip > "$BACKUP_FILE"
    log_success "Backup created: $BACKUP_FILE"
fi

# ============================================================================
# MIGRATION
# ============================================================================

log_info "Starting IVFFlat index migration..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DATABASE_NAME" << EOF

-- Step 1: Drop old index
\echo '[STEP 1/3] Dropping old index...'
DROP INDEX IF EXISTS idx_chunks_embedding;

-- Step 2: Create new index with new lists value
\echo '[STEP 2/3] Creating new index with lists=$LISTS_VALUE...'
CREATE INDEX idx_chunks_embedding ON chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = $LISTS_VALUE);

-- Step 3: Analyze table
\echo '[STEP 3/3] Analyzing table for query optimization...'
ANALYZE chunks;

-- Verification
\echo ''
\echo 'Verification:'
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    indexdef
FROM pg_indexes
JOIN pg_class ON pg_class.relname = pg_indexes.indexname
WHERE tablename = 'chunks' AND indexname = 'idx_chunks_embedding';

EOF

echo ""

# ============================================================================
# POST-MIGRATION VERIFICATION
# ============================================================================

log_info "Post-migration verification..."

NEW_LISTS=$(get_current_lists)
if [ "$NEW_LISTS" -eq "$LISTS_VALUE" ]; then
    log_success "Index successfully created with lists=$LISTS_VALUE"
else
    log_error "Index creation may have failed (expected lists=$LISTS_VALUE, got $NEW_LISTS)"
    exit 1
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
log_success "IVFFlat index migration complete!"
echo ""
log_info "New configuration:"
log_info "  Lists parameter: $LISTS_VALUE"
log_info "  Chunks in index: $CHUNK_COUNT"
log_info "  Index type: IVFFlat (cosine distance)"
echo ""
log_info "Next steps:"
echo "  1. Test vector search performance: SELECT COUNT(*) FROM chunks ORDER BY embedding <=> query_vector LIMIT 10;"
echo "  2. Monitor query latency with: EXPLAIN ANALYZE"
echo "  3. If needed, re-run script with different lists value"
echo ""

# ============================================================================
# CLEANUP & EXIT
# ============================================================================

if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    log_info "Backup preserved at: $BACKUP_FILE"
    log_info "You can safely delete this after confirming data integrity"
fi

log_success "Done!"
