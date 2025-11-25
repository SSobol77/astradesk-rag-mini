# Architecture Documentation - AstraDesk RAG Mini

## Overview

AstraDesk RAG Mini is a production-ready Retrieval-Augmented Generation (RAG) system built with Spring Boot 3.4.0, implementing semantic search over document collections using vector embeddings and PostgreSQL with pgvector.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web UI     │  │   REST API   │  │   CLI Tools  │     │
│  │  (Next.js)   │  │   Clients    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Spring WebFlux (Reactive)                           │  │
│  │  - CORS Configuration                                │  │
│  │  - Rate Limiting (Token Bucket)                      │  │
│  │  - API Key Validation                                │  │
│  │  - Request Logging                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Controller Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ DocumentController│  │  ZipController   │               │
│  │  /docs/search    │  │  /ingest/zip     │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   RagService     │  │ ZipIngestService │               │
│  │  (Orchestration) │  │  (Processing)    │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Embeddings     │  │    ChatLLM       │               │
│  │   (Interface)    │  │   (Interface)    │               │
│  └──────────────────┘  └──────────────────┘               │
│           │                      │                          │
│  ┌────────┴────────┐    ┌───────┴────────┐                │
│  │ SpringAi        │    │ SpringAi       │                │
│  │ OpenAiHttp      │    │ OpenAiHttp     │                │
│  │ Fake (Testing)  │    │ Fake (Testing) │                │
│  └─────────────────┘    └────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Access Layer (JDBC)                       │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │ DocumentJdbcRepository│  │ ChunkJdbcRepository  │       │
│  │  (JdbcTemplate)       │  │  (JdbcTemplate)      │       │
│  └──────────────────────┘  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Storage Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   PostgreSQL     │  │   S3/MinIO       │               │
│  │   + pgvector     │  │  (Documents)     │               │
│  │  (Vectors/Meta)  │  │                  │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Spring Boot**: 3.4.0
- **Java**: 21 LTS (Eclipse Temurin)
- **Build Tool**: Gradle 8.14
- **Reactive Stack**: Spring WebFlux (Netty)

### Database & Vector Store
- **Database**: PostgreSQL 16/17
- **Vector Extension**: pgvector 0.1.6
- **JDBC Driver**: PostgreSQL 42.7.8
- **Connection Pool**: HikariCP (Spring Boot default)

### AI/ML Integration
- **Framework**: Spring AI 0.8.1
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Chat Model**: OpenAI gpt-4o-mini
- **Alternative**: Direct HTTP client implementation

### Document Processing
- **PDF**: Apache PDFBox 3.0.6
- **HTML**: Jsoup 1.21.2
- **Language Detection**: Lingua 1.2.2
- **Supported Formats**: PDF, HTML, Markdown, TXT

### Storage
- **Object Storage**: AWS S3 SDK v2 (2.38.2)
- **Compatible**: MinIO, AWS S3, S3-compatible services
- **Path Style**: Configurable

### Observability
- **Metrics**: Micrometer + Prometheus
- **Tracing**: OpenTelemetry + OTLP exporter
- **Health Checks**: Spring Boot Actuator
- **Logging**: SLF4J + Logback

### Testing
- **Unit Tests**: JUnit 5 + Mockito
- **Integration Tests**: TestContainers
- **Container Images**: PostgreSQL with pgvector

## Component Details

### 1. Controller Layer

#### DocumentController
**Responsibility**: Handle document search requests

**Endpoints**:
- `GET /docs/search?q={query}&k={limit}`

**Features**:
- Query parameter validation
- Result limiting (default: 5, configurable)
- JSON response serialization

**Code Location**: `com.astradesk.rag.controller.DocumentController`

#### ZipController
**Responsibility**: Handle document ingestion via ZIP upload

**Endpoints**:
- `POST /ingest/zip` (multipart/form-data)

**Features**:
- Server-Sent Events (SSE) for progress streaming
- Configurable chunking parameters
- Collection-based organization
- Real-time progress updates

**Code Location**: `com.astradesk.rag.controller.ZipController`

#### HealthController
**Responsibility**: Application health monitoring

**Endpoints**:
- `GET /health`

**Features**:
- Database connectivity check
- JSON status response
- HTTP 503 on failure

**Code Location**: `com.astradesk.rag.controller.HealthController`

### 2. Service Layer

#### RagService
**Responsibility**: Core RAG orchestration

**Key Methods**:
```java
List<ChunkRecord> search(String query, Integer k)
String chat(String question, Integer k)
```

**Workflow**:
1. Convert query to embedding vector
2. Search similar chunks in database
3. Return ranked results by similarity

**Dependencies**:
- `Embeddings` (interface)
- `ChunkJdbcRepository`
- `ChatLLM` (interface)

**Code Location**: `com.astradesk.rag.service.RagService`

#### ZipIngestService
**Responsibility**: Document ingestion pipeline

**Key Methods**:
```java
Flux<ProgressEvent> ingestZipAsStream(MultipartFile file, String collection, int maxLen, int overlap)
```

**Workflow**:
1. Validate ZIP file
2. Extract entries (single-pass)
3. Detect document language
4. Extract text content
5. Chunk text intelligently
6. Generate embeddings
7. Store in database + S3
8. Stream progress events

**Features**:
- Reactive processing (boundedElastic scheduler)
- Intelligent text chunking (sentence/word boundaries)
- Language detection before storage
- Progress tracking per document/page
- Error handling and recovery

**Code Location**: `com.astradesk.rag.service.ZipIngestService`

### 3. Provider Interfaces

#### Embeddings Interface
**Purpose**: Abstract embedding generation

**Implementations**:
- **SpringAiEmbeddings**: Uses Spring AI framework
- **OpenAiHttpEmbeddings**: Direct HTTP to OpenAI API
- **FakeEmbeddings**: Deterministic fake vectors for testing

**Configuration**:
```yaml
rag:
  provider:
    embeddings: springai  # or openai, fake
```

**Code Location**: `com.astradesk.rag.service.Embeddings`

#### ChatLLM Interface
**Purpose**: Abstract chat completion

**Implementations**:
- **SpringAiChat**: Uses Spring AI framework
- **OpenAiHttpChat**: Direct HTTP to OpenAI API
- **FakeChat**: Returns mock responses for testing

**Configuration**:
```yaml
rag:
  provider:
    chat: springai  # or openai, fake
```

**Code Location**: `com.astradesk.rag.service.ChatLLM`

### 4. Data Access Layer

#### DocumentJdbcRepository
**Responsibility**: Document metadata persistence

**Key Methods**:
```java
long insertDoc(String title, String language)
Optional<Document> findById(long id)
List<Document> findAll()
```

**Code Location**: `com.astradesk.rag.repo.DocumentJdbcRepository`

#### ChunkJdbcRepository
**Responsibility**: Vector chunk storage and search

**Key Methods**:
```java
void insertChunk(long docId, int chunkIndex, String content, float[] embedding, ...)
List<ChunkRecord> findSimilar(float[] queryVector, int limit)
```

**Vector Search Query**:
```sql
SELECT *, 1 - (embedding <=> ?::vector) as score
FROM chunks
ORDER BY embedding <=> ?::vector
LIMIT ?
```

**Code Location**: `com.astradesk.rag.repo.ChunkJdbcRepository`

### 5. Configuration Layer

#### ProviderConfig
**Responsibility**: Conditional bean injection for providers

**Features**:
- `@ConditionalOnProperty` for provider selection
- Fake implementations for testing
- Dependency injection for implementations

**Code Location**: `com.astradesk.rag.config.ProviderConfig`

#### S3Config
**Responsibility**: S3/MinIO client configuration

**Features**:
- AWS SDK v2 client builder
- Path-style access support
- Region configuration
- Credential management

**Code Location**: `com.astradesk.rag.config.S3Config`

#### CorsConfig
**Responsibility**: Cross-Origin Resource Sharing

**Features**:
- Configurable allowed origins
- WebFlux CORS configuration
- Development-friendly defaults

**Code Location**: `com.astradesk.rag.config.CorsConfig`

#### RateLimitFilter
**Responsibility**: API rate limiting

**Features**:
- Token bucket algorithm
- Per API key tracking
- Configurable limits (requests per minute)
- WebFlux WebFilter implementation

**Code Location**: `com.astradesk.rag.config.RateLimitFilter`

#### ApiKeyValidator
**Responsibility**: API key authentication

**Features**:
- Header-based authentication
- Optional (disabled by default)
- WebFlux WebFilter implementation

**Code Location**: `com.astradesk.rag.config.ApiKeyValidator`

### 6. Utility Layer

#### Chunker
**Responsibility**: Intelligent text splitting

**Algorithm**:
1. **Sentence boundary detection** (100-char lookback)
   - Delimiters: `。!?！？\n`
2. **Word boundary detection** (50-char lookback)
   - Delimiters: ` \t\n\r`
3. **Fallback**: Last non-alphanumeric character

**Key Method**:
```java
public static List<String> split(String text, int maxLen, int overlap)
```

**Features**:
- Preserves semantic meaning
- Configurable max length and overlap
- Whitespace trimming
- Multi-language support

**Code Location**: `com.astradesk.rag.util.Chunker`

## Data Flow

### Document Ingestion Flow

```
1. Client uploads ZIP
   ↓
2. ZipController receives multipart file
   ↓
3. ZipIngestService.ingestZipAsStream()
   ├─ Validate ZIP format
   ├─ Extract entries (single-pass, reactive)
   └─ For each document:
      ├─ Extract text content
      ├─ Detect language (BEFORE DB insert)
      ├─ Insert document metadata → docs table
      ├─ Chunker.split(text, maxLen, overlap)
      ├─ For each chunk:
      │  ├─ Embeddings.embed(chunk) → float[1536]
      │  ├─ Store in chunks table with vector
      │  └─ Upload original to S3/MinIO
      └─ Emit ProgressEvent (SSE)
   ↓
4. Client receives real-time progress
   ↓
5. Documents ready for search
```

### Search Flow

```
1. Client sends query: GET /docs/search?q=AI&k=5
   ↓
2. DocumentController.search(q, k)
   ↓
3. RagService.search(query, k)
   ├─ Embeddings.embed(query) → float[1536]
   ├─ ChunkJdbcRepository.findSimilar(vector, k)
   │  └─ SQL: ORDER BY embedding <=> vector LIMIT k
   │     (Uses IVFFlat index for ANN search)
   └─ Return List<ChunkRecord> with scores
   ↓
4. Client receives ranked results
```

### Chat Flow (RAG)

```
1. Client sends question
   ↓
2. RagService.chat(question, k)
   ├─ search(question, k) → List<ChunkRecord>
   ├─ Extract contexts from chunks
   ├─ ChatLLM.answer(question, contexts)
   │  └─ Construct prompt with contexts
   │  └─ Call LLM API
   └─ Return generated answer
   ↓
3. Client receives contextualized answer
```

## Database Schema

### Tables

#### docs
```sql
CREATE TABLE docs (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  language   TEXT,                 -- ISO 639-1 code
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Store document metadata

**Indexes**: Primary key (id)

#### chunks
```sql
CREATE TABLE chunks (
  id          BIGSERIAL PRIMARY KEY,
  doc_id      BIGINT NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_from   INT,
  page_to     INT,
  source_key  TEXT,                -- S3 key
  content     TEXT NOT NULL,
  embedding   VECTOR(1536) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Store text chunks with vector embeddings

**Indexes**:
- Primary key (id)
- Foreign key (doc_id)
- IVFFlat vector index (embedding)

### Vector Index

```sql
CREATE INDEX idx_chunks_embedding 
  ON chunks USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
```

**Algorithm**: IVFFlat (Inverted File Flat)
**Distance Metric**: Cosine similarity
**Lists Parameter**: 100 (optimal for 100K-1M vectors)

**Tuning Formula**:
```
lists = MAX(1, SQRT(total_chunks / 10))
```

**See**: [DATABASE_TUNING_GUIDE.md](DATABASE_TUNING_GUIDE.md) for details

## Reactive Architecture

### WebFlux + JDBC Considerations

**Current Setup**:
- **Web Layer**: Spring WebFlux (reactive, non-blocking)
- **Data Layer**: JDBC + HikariCP (blocking)

**Implications**:
- JDBC operations block threads from bounded elastic scheduler
- Acceptable for moderate traffic (HikariCP pool handles concurrency)
- For high-traffic scenarios, consider R2DBC (reactive database driver)

**Thread Model**:
```
HTTP Request (Netty event loop)
    ↓
WebFlux Controller (non-blocking)
    ↓
Service Layer (non-blocking)
    ↓
JDBC Repository (blocks on boundedElastic thread)
    ↓
HikariCP Connection Pool
    ↓
PostgreSQL
```

**Best Practices**:
- Keep JDBC operations fast (<100ms)
- Monitor HikariCP pool utilization
- Use appropriate pool size (default: 10 max)
- Consider R2DBC for >1000 req/sec

## Security Architecture

### Authentication
- **API Key**: Optional header-based authentication
- **Configuration**: `rag.api-key` property
- **Implementation**: WebFlux WebFilter

### Rate Limiting
- **Algorithm**: Token bucket
- **Tracking**: Per API key (or IP fallback)
- **Configuration**: `rag.rate-limit.requests-per-minute`
- **Storage**: In-memory (Redis-ready architecture)

### CORS
- **Allowed Origins**: Configurable list
- **Default**: `http://localhost:3000,http://localhost:8080`
- **Configuration**: `rag.cors.allowed-origins`

### File Upload
- **Max Size**: 100MB (configurable)
- **Validation**: File type checking
- **Supported**: ZIP archives only

### Secrets Management
- **Environment Variables**: All sensitive data
- **No Hardcoding**: Enforced in code reviews
- **Examples**: `.env.example` provided

## Observability

### Metrics
- **Framework**: Micrometer
- **Export**: Prometheus format
- **Endpoint**: `/actuator/prometheus`
- **Metrics**:
  - HTTP request duration
  - Database connection pool stats
  - JVM memory/GC
  - Custom business metrics

### Tracing
- **Framework**: OpenTelemetry
- **Export**: OTLP (gRPC/HTTP)
- **Sampling**: 100% (configurable)
- **Backends**: Jaeger, Zipkin, AWS X-Ray

### Health Checks
- **Endpoints**:
  - `/health` - Simple JSON response
  - `/actuator/health` - Detailed Spring Boot health
- **Checks**:
  - Database connectivity
  - Disk space
  - Liveness/readiness probes

### Logging
- **Framework**: SLF4J + Logback
- **Levels**: Configurable per package
- **Format**: JSON (production) or console (development)
- **Request Logging**: WebFlux WebFilter

## Performance Characteristics

### Vector Search
- **Latency**: <100ms for 10k+ documents (p95)
- **Throughput**: ~100 queries/sec (single instance)
- **Index**: IVFFlat with lists=100
- **Accuracy**: ~90-95% recall

### Document Ingestion
- **Speed**: ~5-10 chunks/second
- **Concurrency**: Reactive (boundedElastic scheduler)
- **Bottleneck**: Embedding API calls
- **Optimization**: Batch embedding requests

### Database
- **Connection Pool**: HikariCP (10 max, 2 min idle)
- **Query Time**: <50ms for vector search
- **Index Size**: ~0.5-2 GB per 1M vectors
- **Memory**: ~2-8 GB depending on dataset

## Scalability

### Horizontal Scaling
- **Stateless**: Application is fully stateless
- **Load Balancer**: Any HTTP load balancer
- **Session**: No session state
- **Limitations**: Rate limiting is in-memory (use Redis for distributed)

### Vertical Scaling
- **CPU**: Increase for more concurrent requests
- **Memory**: Increase for larger connection pools
- **Database**: Scale PostgreSQL independently

### Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Partitioning**: By collection or date
- **Sharding**: By document ID hash
- **Limitations**: pgvector doesn't support distributed queries

## Deployment Patterns

### Single Instance
```
Docker Container
├─ Spring Boot App (8080)
├─ PostgreSQL (5432)
└─ MinIO (9000)
```

**Use Case**: Development, small deployments (<10k docs)

### Multi-Instance
```
Load Balancer
├─ App Instance 1
├─ App Instance 2
└─ App Instance N
    ↓
Shared PostgreSQL + pgvector
Shared S3/MinIO
```

**Use Case**: Production (10k-1M docs)

### Kubernetes
```
Ingress
├─ App Deployment (3+ replicas)
├─ PostgreSQL StatefulSet
└─ S3 (external)
```

**Use Case**: Cloud-native, auto-scaling

## Extension Points

### Custom Embeddings Provider
1. Implement `Embeddings` interface
2. Add `@ConditionalOnProperty` annotation
3. Configure in `application.yml`

### Custom Chat Provider
1. Implement `ChatLLM` interface
2. Add `@ConditionalOnProperty` annotation
3. Configure in `application.yml`

### Custom Document Format
1. Add file extension to supported list
2. Implement text extraction method
3. Add content type mapping

### Custom Chunking Strategy
1. Modify `Chunker.split()` method
2. Or create new chunker implementation
3. Inject via configuration

## Best Practices

### Development
- Use `fake` providers for testing (no API costs)
- Run PostgreSQL via Docker Compose
- Enable debug logging for troubleshooting

### Testing
- Use TestContainers for integration tests
- Mock external APIs (OpenAI)
- Test with realistic document sizes

### Production
- Use `openai` or `springai` providers
- Configure rate limiting
- Enable OpenTelemetry tracing
- Set up monitoring and alerts
- Use managed PostgreSQL (RDS, Cloud SQL)
- Use managed S3 (AWS S3, GCS)

### Operations
- Monitor vector search latency
- Run `ANALYZE chunks` after large ingests
- Tune IVFFlat `lists` parameter as dataset grows
- Regular database backups
- Capacity planning for 2x growth

## References

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring WebFlux Guide](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
