# Database & Index Documentation - Summary

## What Was Added

### 1. **Comprehensive Database Tuning Guide** (`docs/DATABASE_TUNING_GUIDE.md`)

A production-ready guide covering:

- **pgvector Setup**: Docker, macOS, and Linux installation instructions
- **IVFFlat Index Tuning**: Dataset size → recommended `lists` parameter mapping
  - Small datasets (1K-10K chunks): `lists=10-50`
  - Medium datasets (10K-100K): `lists=50-200` (100 is default)
  - Large datasets (100K-1M): `lists=500-1000`
  - Massive datasets (1M+): `lists=2000-5000`
- **Performance Optimization**: Connection pooling, memory management, query tuning
- **Troubleshooting**: Common issues with solutions (pgvector not found, dimension mismatch, slow queries, high memory)
- **Monitoring**: Metrics to track for optimal performance
- **Migration Scripts**: Zero-downtime index rebuilding for scaling

### 2. **Enhanced schema.sql with Inline Documentation** (`src/main/resources/schema.sql`)

Added comprehensive comments explaining:

- **pgvector Extension**: Why it's needed, version requirements
- **Vector Configuration**: Model (text-embedding-3-small), dimensions (1536), distance metric (cosine)
- **IVFFlat Parameter Tuning**:
  - Table showing recommended `lists` values by dataset size
  - Formula: `lists = MAX(1, SQRT(total_chunks / 10))`
  - Performance characteristics of each setting
  - How to modify after deployment
- **Migration Instructions**: Steps for changing embedding dimensions or performing zero-downtime migrations

### 3. **Automated Migration Script** (`scripts/migrate-ivfflat-lists.sh`)

A production-ready Bash script for re-indexing with different `lists` values:

**Features:**
- Pre-flight validation (PostgreSQL, pgvector, table existence)
- Current state analysis (chunk count, current lists value, recommendations)
- Automatic backup creation
- Interactive confirmation before proceeding
- Step-by-step migration with timestamps
- Post-migration verification
- Detailed logging for audit trail

**Usage:**
```bash
# Small dataset optimization
./scripts/migrate-ivfflat-lists.sh 50

# Medium dataset (default)
./scripts/migrate-ivfflat-lists.sh 100

# Large dataset scaling
./scripts/migrate-ivfflat-lists.sh 500

# Custom database
./scripts/migrate-ivfflat-lists.sh 300 production_db production_user
```

### 4. **Updated README.md**

Added reference to new database tuning guide in documentation section:
```markdown
- **[Database Tuning Guide](docs/DATABASE_TUNING_GUIDE.md)** - PostgreSQL, pgvector, IVFFlat optimization
```


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
