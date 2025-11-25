# Scripts Reference Guide

Quick reference for all project scripts.

---

## Build & Deployment

### `QUICK_START.sh`
**Purpose**: Start all services (PostgreSQL, MinIO, Application)

```bash
./QUICK_START.sh
```

**What it does**:
1. Stops existing containers
2. Creates Docker network
3. Starts PostgreSQL with pgvector
4. Initializes database schema
5. Starts MinIO
6. Starts Spring Boot application
7. Tests health endpoint

**Output**: Services running on ports 5432, 9000, 9001, 8081

---

## Database Initialization

### `init-database-docker.sh`
**Purpose**: Initialize database in Docker container

```bash
./init-database-docker.sh [container_name]
```

**Default**: `container_name=rag-db`

**What it does**:
1. Creates pgvector extension
2. Drops existing tables
3. Creates docs and chunks tables
4. Creates indexes (B-tree + IVFFlat)
5. Verifies schema

**Example**:
```bash
./init-database-docker.sh rag-db
```

---

### `init-database.sh`
**Purpose**: Initialize production/remote database

```bash
export PGPASSWORD='password'
./init-database.sh [host] [port] [database] [user]
```

**Defaults**: `localhost 5432 rag rag`

**What it does**:
1. Tests connection
2. Creates pgvector extension
3. Creates tables and indexes
4. Shows table structure
5. Verifies schema

**Example**:
```bash
export PGPASSWORD='mypassword'
./init-database.sh prod-db.example.com 5432 rag_prod rag_user
```

---

## Testing

### `test-api-v1.sh`
**Purpose**: Test all API v1 endpoints

```bash
./test-api-v1.sh [port]
```

**Default**: `port=8081`

**What it does**:
1. Tests health endpoint
2. Tests search endpoint
3. Creates test ZIP file
4. Tests ingest endpoint (SSE stream)

**Example**:
```bash
./test-api-v1.sh 8081
```

**Output**:
```
=== 1. Health ===
{"status":"UP","database":"connected","error":null}

=== 2. Search ===
[]

=== 3. Ingest ===
event: progress
data: {"stage":"RECEIVED",...}
```

---

## Build Scripts

### Build with Docker (Recommended)

```bash
docker run --rm -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk bash -c "./gradlew clean build -x test"
```

**Output**: `build/libs/astradesk-rag-mini-0.2.0.jar`

### Build with Local Gradle

```bash
./gradlew clean build
```

**Requires**: Java 21 installed locally

---

## Container Management

### Start All Services

```bash
./QUICK_START.sh
```

### Stop All Services

```bash
docker stop rag-app rag-db rag-minio
docker rm rag-app rag-db rag-minio
docker network rm astradesk-rag
```

### Restart Application Only

```bash
docker restart rag-app
```

### View Logs

```bash
# Application logs
docker logs -f rag-app

# Database logs
docker logs -f rag-db

# MinIO logs
docker logs -f rag-minio
```

---

## Quick Commands

### Check Service Status

```bash
docker ps | grep rag
```

### Test Database Connection

```bash
docker exec rag-db pg_isready -U rag
```

### Query Database

```bash
docker exec -it rag-db psql -U rag -d rag
```

### Check Table Counts

```bash
docker exec rag-db psql -U rag -d rag -c "
SELECT 'docs' as table, COUNT(*) as rows FROM docs
UNION ALL
SELECT 'chunks' as table, COUNT(*) as rows FROM chunks;"
```

### Test API Endpoints

```bash
# Health
curl "http://localhost:8081/api/v1/health"

# Search
curl "http://localhost:8081/api/v1/docs/search?q=test&k=3"

# Ingest
curl -X POST -F "file=@test.zip" \
  "http://localhost:8081/api/v1/ingest/zip" --no-buffer
```

---

## Troubleshooting Scripts

### Reset Everything

```bash
# Stop and remove all containers
docker stop rag-app rag-db rag-minio 2>/dev/null
docker rm rag-app rag-db rag-minio 2>/dev/null
docker network rm astradesk-rag 2>/dev/null

# Start fresh
./QUICK_START.sh
./init-database-docker.sh
```

### Rebuild Application

```bash
# Build new JAR
docker run --rm -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk bash -c "./gradlew clean build -x test"

# Restart app
docker restart rag-app
```

### Fix Database Connection

```bash
# Reinitialize database
./init-database-docker.sh rag-db

# Restart app
docker restart rag-app

# Wait and test
sleep 20
curl "http://localhost:8081/api/v1/health"
```

---

## Environment Variables

### Application

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://rag-db:5432/rag
SPRING_DATASOURCE_USERNAME=rag
SPRING_DATASOURCE_PASSWORD=rag
S3_ENDPOINT=http://rag-minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
RAG_PROVIDER_EMBEDDINGS=fake  # or: springai, openai
RAG_PROVIDER_CHAT=fake        # or: springai, openai
OPENAI_API_KEY=sk-...         # if using openai provider
```

### Database

```bash
POSTGRES_DB=rag
POSTGRES_USER=rag
POSTGRES_PASSWORD=rag
```

### MinIO

```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

---

## Script Locations

```
astradesk-rag-mini/
├── QUICK_START.sh              # Start all services
├── init-database.sh            # Production DB init
├── init-database-docker.sh     # Docker DB init
├── test-api-v1.sh              # API testing
├── DATABASE_SETUP.md           # DB documentation
├── SCRIPTS_REFERENCE.md        # This file
└── build/libs/
    └── astradesk-rag-mini-0.2.0.jar
```

---

## Common Workflows

### First Time Setup

```bash
# 1. Build
docker run --rm -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk bash -c "./gradlew clean build -x test"

# 2. Start services
./QUICK_START.sh

# 3. Initialize database
./init-database-docker.sh

# 4. Test
./test-api-v1.sh 8081
```

### Daily Development

```bash
# Start services
docker start rag-db rag-minio rag-app

# Test
curl "http://localhost:8081/api/v1/health"
```

### After Code Changes

```bash
# Rebuild
docker run --rm -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk bash -c "./gradlew build -x test"

# Restart
docker restart rag-app

# Test
./test-api-v1.sh 8081
```

---

**Author**: Cartesian School - Siergiej Sobolewski  
**Last Updated**: 2025-01-24
