#!/bin/bash
# Quick start script for AstraDesk RAG with API v1

echo "🚀 Starting AstraDesk RAG Mini..."

# Stop existing containers
docker rm -f rag-app rag-db rag-minio 2>/dev/null
docker network rm astradesk-rag 2>/dev/null

# Create network
docker network create astradesk-rag

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker run -d --name rag-db --network astradesk-rag \
  -e POSTGRES_DB=rag -e POSTGRES_USER=rag -e POSTGRES_PASSWORD=rag \
  -p 5432:5432 pgvector/pgvector:pg16

# Wait for DB
sleep 10

# Initialize DB
echo "🔧 Initializing database..."
docker exec rag-db psql -U rag -d rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec -i rag-db psql -U rag -d rag <<'EOF'
CREATE TABLE IF NOT EXISTS docs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  doc_id BIGINT REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_from INT, page_to INT,
  source_key TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chunks_docid ON chunks(doc_id);
EOF

# Start MinIO
echo "📦 Starting MinIO..."
docker run -d --name rag-minio --network astradesk-rag \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# Start Application
echo "📦 Starting Application..."
docker run -d --name rag-app --network astradesk-rag \
  -p 8081:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://rag-db:5432/rag \
  -e SPRING_DATASOURCE_USERNAME=rag \
  -e SPRING_DATASOURCE_PASSWORD=rag \
  -e SPRING_SQL_INIT_MODE=never \
  -e S3_ENDPOINT=http://rag-minio:9000 \
  -e RAG_PROVIDER_EMBEDDINGS=fake \
  -e RAG_PROVIDER_CHAT=fake \
  -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk \
  bash -c "java -Dspring.autoconfigure.exclude=org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration -jar build/libs/astradesk-rag-mini-0.2.0.jar"

echo "⏳ Waiting for application startup (30s)..."
sleep 30

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Endpoints:"
echo "   Health:  http://localhost:8081/api/v1/health"
echo "   Search:  http://localhost:8081/api/v1/docs/search?q=test&k=3"
echo "   Ingest:  http://localhost:8081/api/v1/ingest/zip"
echo "   MinIO:   http://localhost:9001 (admin/minioadmin)"
echo ""
echo "🧪 Test:"
curl -s "http://localhost:8081/api/v1/health" | python3 -m json.tool 2>/dev/null || curl -s "http://localhost:8081/api/v1/health"
echo ""
