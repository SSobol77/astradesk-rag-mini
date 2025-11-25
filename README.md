# AstraDesk RAG Mini - Retrieval-Augmented Generation Application

A production-ready Spring Boot 3.4.0 application implementing Retrieval-Augmented Generation (RAG) with vector embeddings, semantic search, and multi-LLM provider support.

> **📚 [Complete Documentation Index](docs/INDEX.md)** | **🚀 [Quick Start](docs/QUICK-START.md)** | **👨‍💻 [Developer Guide](docs/DEVELOPER_GUIDE.md)** | **🔧 [CI/CD Setup](docs/CI_CD_SETUP.md)**

## 📋 Overview

**AstraDesk RAG Mini** is an enterprise-grade RAG system that:
- 🔍 Performs semantic search across document collections using vector embeddings
- 📚 Ingests multiple document formats (PDF, HTML, Markdown, TXT)
- 🔐 Stores vectors in PostgreSQL with pgvector extension
- 🚀 Streams real-time ingestion progress via Server-Sent Events
- 🤖 Supports multiple LLM providers (OpenAI, Spring AI, Fake for testing)
- 💾 Integrates with S3/MinIO for document storage
- 🎯 Chunks documents intelligently with configurable overlap
- 🌍 Detects document language automatically

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Spring Boot | 3.4.0 |
| **Java** | Temurin | 21 LTS |
| **Database** | PostgreSQL + pgvector | 16/17 |
| **Vector Store** | pgvector | 0.1.6 |
| **AI/ML** | Spring AI + OpenAI | 0.8.1 |
| **Storage** | AWS S3 SDK v2 / MinIO | 2.38.2 |
| **Build** | Gradle | 8.14 |
| **Container** | Docker | Multi-stage |
| **Observability** | Micrometer + OpenTelemetry | Latest |

### Support Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| **WebFlux (Reactive)** | ✅ Stable | All filters use WebFilter |
| **JDBC + HikariCP** | ✅ Stable | Blocking calls, consider R2DBC for high traffic |
| **OpenAI Embeddings** | ✅ Stable | text-embedding-3-small (1536d) |
| **OpenAI Chat** | ✅ Stable | gpt-4o-mini |
| **Spring AI** | ⚠️ Optional | API compatibility issues, use OpenAI HTTP |
| **pgvector** | ✅ Stable | IVFFlat index, cosine distance |
| **S3/MinIO** | ✅ Stable | AWS SDK v2 |
| **Rate Limiting** | ✅ Stable | Token bucket, in-memory |
| **OpenTelemetry** | ✅ Stable | OTLP exporter |
| **TestContainers** | ✅ Stable | Integration tests |
| **Prometheus** | ✅ Stable | Metrics export |
| **Docker Health** | ✅ Stable | /api/v1/health endpoint |
| **API Versioning** | ✅ Stable | /api/v1 prefix |

### Package Structure

```
com.astradesk.rag
├── controller/          # REST API endpoints
│   ├── DocumentController
│   └── ZipController
├── service/            # Business logic
│   ├── RagService           (search & chat orchestration)
│   ├── ZipIngestService     (document ingestion)
│   ├── Embeddings           (interface)
│   ├── SpringAiEmbeddings   (implementation)
│   ├── OpenAiHttpEmbeddings (implementation)
│   ├── ChatLLM              (interface)
│   ├── SpringAiChat         (implementation)
│   └── OpenAiHttpChat       (implementation)
├── repo/               # Data access
│   ├── DocumentJdbcRepository
│   └── ChunkJdbcRepository
├── config/             # Spring configuration
│   ├── S3Config
│   ├── ProviderConfig      (dependency injection for providers)
│   ├── S3StorageService
│   └── GlobalExceptionHandler
├── model/              # Data models
│   ├── ChunkRecord      (search results)
│   ├── ProgressEvent    (SSE ingestion events - 7 fields)
│   └── HealthResponse   (health check - 3 fields)
└── util/               # Utilities
    └── Chunker
```

## 🚀 Quick Start

### Prerequisites
- **Java 21+** (OpenJDK Temurin)
- **Docker**
- **OpenAI API Key** (optional, for production use)

### 1. Quick Start (Recommended)

```bash
# Build the project
docker run --rm -v "$PWD":/workspace -w /workspace \
  eclipse-temurin:21-jdk bash -c "./gradlew clean build -x test"

# Start all services
./QUICK_START.sh

# Initialize database
./init-database-docker.sh

# Test API v1
curl "http://localhost:8081/api/v1/health"
```

### 2. Manual Setup

```bash
# Start services
docker network create astradesk-rag
docker run -d --name rag-db --network astradesk-rag \
  -e POSTGRES_DB=rag -e POSTGRES_USER=rag -e POSTGRES_PASSWORD=rag \
  -p 5432:5432 pgvector/pgvector:pg16

# Initialize database
./init-database-docker.sh rag-db

# Start application
docker run -d --name rag-app --network astradesk-rag -p 8081:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://rag-db:5432/rag \
  -e RAG_PROVIDER_EMBEDDINGS=fake -e RAG_PROVIDER_CHAT=fake \
  -v "$PWD":/workspace -w /workspace eclipse-temurin:21-jdk \
  bash -c "java -jar build/libs/astradesk-rag-mini-0.2.0.jar"
```

The application will be available at `http://localhost:8081`

## 📖 API Endpoints

> **Note**: All endpoints use `/api/v1` prefix. See [API Migration Guide](docs/API_MIGRATION_V1.md) for details.

### Document Search

**Request:**
```http
GET /api/v1/docs/search?q=Spring%20AI&k=5
```

**Parameters:**
- `q` (required): Search query
- `k` (optional): Number of results to return (default: 5)

**Response:**
```json
[
  {
    "id": 1,
    "docId": 1,
    "chunkIndex": 0,
    "pageFrom": 1,
    "pageTo": 1,
    "content": "Spring AI enables developers to...",
    "score": 0.92
  }
]
```

### ZIP Ingestion (Streaming)

**Request:**
```http
POST /api/v1/ingest/zip?collection=docs&maxLen=1200&overlap=200
Content-Type: multipart/form-data

file=@archive.zip
```

**Parameters:**
- `file` (required): ZIP archive
- `collection` (optional): Collection name (default: "default")
- `maxLen` (optional): Chunk max length (default: 1200)
- `overlap` (optional): Chunk overlap (default: 200)

**Response (Server-Sent Events):**
```
event: progress
data: {"stage":"RECEIVED","file":"document.pdf","processed":1,"message":"processing","error":null}

event: progress
data: {"stage":"INDEXED","file":"document.pdf","page":1,"processed":1,"total":10,"message":"ok","error":null}

event: progress
data: {"stage":"DONE","file":"archive.zip","message":"finished","error":null}
```

## ⚙️ Configuration

### application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: astradesk-rag-mini
  datasource:
    url: jdbc:postgresql://localhost:5432/rag
    username: rag
    password: rag
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        options:
          model: gpt-4o-mini
      embedding:
        options:
          model: text-embedding-3-small

rag:
  provider:
    embeddings: springai    # springai | openai | fake
    chat: springai          # springai | openai | fake
  embedding-dim: 1536
  topk: 5
  chunk:
    maxLen: 1200
    overlap: 200

s3:
  endpoint: ${S3_ENDPOINT:http://localhost:9000}
  region: ${S3_REGION:us-east-1}
  accessKey: ${S3_ACCESS_KEY:minioadmin}
  secretKey: ${S3_SECRET_KEY:minioadmin}
  bucket: ${S3_BUCKET:astradesk-rag}
  pathStyleAccess: true
```

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=astradesk-rag

# Database (optional, overrides yaml)
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/rag
SPRING_DATASOURCE_USERNAME=rag
SPRING_DATASOURCE_PASSWORD=rag
```

## 🎯 Best Practices

### 1. **Provider Configuration**
Use conditional bean injection for flexibility:
```java
// Configuration automatically selects based on rag.provider.* properties
// - springai: Production-ready Spring AI integration
// - openai: Direct HTTP to OpenAI API
// - fake: Testing/development without API costs
```

### 2. **Document Ingestion**
```bash
# Optimal chunk settings (tested)
maxLen: 1200      # Characters per chunk
overlap: 200      # Character overlap for context continuity
```

### 3. **Embedding Strategy**
- **text-embedding-3-small**: Fast, cost-effective (1536 dims)
- **text-embedding-3-large**: Better quality (3072 dims) - configure via `rag.embedding-dim`

### 4. **Vector Search**
- **Index Type**: IVFFlat with cosine distance
- **Lists Parameter**: 100 (tunable based on dataset size)
- **Query**: Always use LIMIT k for performance

### 5. **Error Handling**
```java
// GlobalExceptionHandler provides:
- MaxUploadSizeExceededException → 413 Payload Too Large
- IllegalArgumentException → 400 Bad Request
- Generic Exception → 500 Internal Server Error
```

### 6. **Database Schema**

```sql
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
  doc_id BIGINT REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_from INT, page_to INT,
  source_key TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_chunks_docid ON chunks(doc_id);
CREATE INDEX idx_chunks_embedding 
  ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

### Integration Tests
Tests use TestContainers for isolated PostgreSQL:
```java
@SpringBootTest
@Testcontainers
public class RagServiceTest {
    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("pgvector/pgvector:pg16");
    
    @Test
    void searchWorks() {
        List<ChunkRecord> res = rag.search("query", 3);
        assertNotNull(res);
    }
}
```

### Manual API Testing

**Automated Test:**
```bash
./test-api-v1.sh 8081
```

**Manual Tests:**
```bash
# Health
curl "http://localhost:8081/api/v1/health"

# Search
curl "http://localhost:8081/api/v1/docs/search?q=AI&k=3"

# Ingest
curl -X POST -F "file=@docs.zip" \
  "http://localhost:8081/api/v1/ingest/zip" --no-buffer
```

## 📊 Performance Considerations

### Chunking Strategy
```
Document → Split into chunks (max 1200 chars, overlap 200 chars)
         → Embed each chunk (1536-dim vectors)
         → Store in PostgreSQL with IVFFlat index
         → Query with semantic similarity
```

### Optimization Tips

1. **Batch Processing**: Process multiple chunks concurrently
2. **Connection Pooling**: HikariCP (default, auto-configured)
3. **Vector Index**: Tune IVFFlat `lists` parameter:
   - Small datasets (<10k): `lists=10`
   - Medium (10k-100k): `lists=100`
   - Large (>100k): `lists=300+`
4. **Search Limit**: Use reasonable `k` values (5-10 typically sufficient)

## 🔒 Security Best Practices

1. **API Keys**: Use environment variables, never hardcode
2. **CORS**: Configure appropriately for frontend access
3. **File Upload**: 
   - Validate file types (already implemented)
   - Set max upload size (via `server.servlet.multipart.max-file-size`)
4. **Database**: Use connection pooling, prepared statements (JDBC templates handle this)
5. **S3 Credentials**: Rotate regularly, use IAM roles in cloud

### Enable CORS (if needed)

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://yourdomain.com")
            .allowedMethods("GET", "POST", "OPTIONS")
            .maxAge(3600);
    }
}
```

## 🚀 Production Deployment

### Docker Deployment
```bash
docker build -t astradesk-rag:1.0 .
docker push your-registry/astradesk-rag:1.0

# Deploy with environment variables
docker run -e OPENAI_API_KEY=sk-... \
           -e S3_ENDPOINT=https://s3.amazonaws.com \
           -e SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/rag \
           -p 8080:8080 \
           astradesk-rag:1.0
```

### Kubernetes (Helm)
```bash
helm install astradesk-rag ./helm-chart \
  --set openai.apiKey=$OPENAI_API_KEY \
  --set postgres.host=prod-pg \
  --set s3.endpoint=https://s3.amazonaws.com
```

### Monitoring & Logging

```yaml
# Add to application.yml for production
logging:
  level:
    com.astradesk.rag: INFO
    org.springframework: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info
  metrics:
    export:
      prometheus:
        enabled: true
```

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if pgvector extension is installed
docker exec astradesk-rag-mini-db psql -U rag -d rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Out of Memory
```bash
# Increase JVM heap (in Dockerfile or JVM_OPTS)
ENV JAVA_OPTS="-Xmx2g -Xms1g -XX:+UseZGC"
```

### S3/MinIO Connection
```bash
# Test MinIO connectivity
docker exec astradesk-rag-mini-app curl -v http://minio:9000/minio/health/live
```

### Slow Searches
### Java compatibility: "IllegalArgumentException: 25.0.1"

If the Gradle build fails with an error that includes a Java version like `25.0.1` (for example, an exception during Gradle script evaluation that mentions `JavaVersion.parse`), your system JDK is newer than the Kotlin/Gradle tooling expects. The project requires Java 21 for the Gradle runtime. Options to resolve:

- Install and use Temurin/OpenJDK 21 and set `JAVA_HOME` before running Gradle:

```bash
# Example using SDKMAN (recommended for developers):
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 21.0.0-tem
sdk use java 21.0.0-tem
./gradlew clean build
```

- Install Temurin 21 via OS package manager (Debian/Ubuntu example):

```bash
# Adoptium repo install (Debian/Ubuntu)
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo 'deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main' | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt-get update
sudo apt-get install -y temurin-21-jdk
export JAVA_HOME="/usr/lib/jvm/temurin-21-jdk"
./gradlew clean build
```

- Use a Docker fallback to run the Gradle wrapper inside a JDK 21 container:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace eclipse-temurin:21-jdk bash -c "./gradlew clean build"
```

This avoids changing your system Java and is useful for CI or one-off builds.

1. Check IVFFlat index configuration
2. Verify query k parameter isn't too large
3. Monitor table statistics: `ANALYZE chunks;`

## 📚 Documentation

### Project Documentation
- **[Quick Start Guide](docs/QUICK-START.md)** - Get started in 5 minutes
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Comprehensive development guide
- **[API Migration Guide](docs/API_MIGRATION_V1.md)** - v1 API changes and migration
- **[Database Setup](DATABASE_SETUP.md)** - Database initialization scripts
- **[Local Development Checklist](docs/LOCAL_DEVELOPMENT_CHECKLIST.md)** - Minimal local setup and exact build versions
- **[Database Tuning Guide](docs/DATABASE_TUNING_GUIDE.md)** - PostgreSQL, pgvector, IVFFlat optimization
- **[Quick Wins Implementation](docs/QUICK_WINS_IMPLEMENTATION.md)** - Recent improvements
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)** - Verification steps
- **[CI/CD Setup](docs/CI_CD_SETUP.md)** - GitHub Actions & GitLab CI/CD
- **[CI/CD Quick Reference](docs/CI_CD_QUICK_REFERENCE.md)** - Quick commands

### Frontend Documentation
- **[Frontend Setup](docs/RAG-FRONTEND-SETUP.md)** - React/Next.js setup
- **[Frontend Guide](docs/RAG-FRONTEND-GUIDE.md)** - Component usage
- **[Integration Summary](docs/RAG-INTEGRATION-SUMMARY.md)** - Backend-Frontend integration

### Project Status
- **[Project Status](docs/PROJECT_STATUS.md)** - Current state and roadmap
- **[Fixes Applied](docs/FIXES_APPLIED.md)** - Bug fixes and improvements
- **[Integration Fixes](docs/INTEGRATION_FIXES_2025_01_24.md)** - Recent integration improvements
- **[Build Success](BUILD_SUCCESS.md)** - Build verification results
- **[Deployment Success](DEPLOYMENT_SUCCESS.md)** - Deployment verification
- **[Verification Checklist](VERIFICATION_CHECKLIST.md)** - Complete verification steps

### External Resources
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Spring Boot Reference](https://spring.io/projects/spring-boot)

## 📝 Contributing

1. **Code Style**: Follow Google Java Style Guide
2. **Testing**: Maintain >80% code coverage
3. **Documentation**: Update README for user-facing changes
4. **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

```bash
# Run quality checks before commit
./gradlew check
```

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Support

For issues or questions:
1. Check existing GitHub issues
2. Review troubleshooting section
3. Run `./test-api-v1.sh` to verify setup
4. Contact: s.sobolewski@hotmail.com

## 📜 Quick Reference Scripts

- `QUICK_START.sh` - Start all services
- `init-database.sh` - Initialize production database
- `init-database-docker.sh` - Initialize Docker database
- `test-api-v1.sh` - Test API v1 endpoints


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
