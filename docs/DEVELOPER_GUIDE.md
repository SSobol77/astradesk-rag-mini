# Developer Quick Reference - AstraDesk RAG Mini

A quick guide for developers working with the AstraDesk RAG Mini project.

## Getting Started

### Initial Setup (5 minutes)

```bash
# 1. Clone and navigate
git clone <repository>
cd astradesk-rag-mini

# 2. Start dependencies
docker-compose up -d

# 3. Build project
./gradlew clean build

# 4. Run application
./gradlew bootRun

# Application is ready at http://localhost:8080
```

### IDE Setup

**IntelliJ IDEA:**
1. Open project root
2. File → Project Structure → Project SDK → Java 21
3. Run → Edit Configurations → Add Gradle bootRun
4. Set working directory to project root

**VS Code:**
1. Install Extensions:
   - Extension Pack for Java
   - Gradle for Java
   - Docker
2. Open project root
3. Click "Run → Start Debugging"

---

## Project Structure

```
src/main/java/com/astradesk/rag/
├── controller/          # REST endpoints
│   ├── DocumentController    (GET /docs/search)
│   └── ZipController         (POST /ingest/zip)
├── service/             # Core logic
│   ├── RagService            (orchestration)
│   ├── ZipIngestService      (document processing)
│   ├── Embeddings            (interface)
│   ├── ChatLLM               (interface)
│   └── [implementations]
├── repo/                # Database access
│   ├── ChunkJdbcRepository
│   └── DocumentJdbcRepository
├── config/              # Configuration
│   ├── ProviderConfig
│   ├── S3Config
│   └── GlobalExceptionHandler
├── model/               # Data models
│   ├── ChunkRecord
│   └── ProgressEvent
└── util/                # Utilities
    └── Chunker
```

---

## Core Concepts

### 1. Embeddings Provider
**Interface**: `Embeddings`
```java
public interface Embeddings {
    float[] embed(String text);  // Returns vector
    int dim();                   // Dimension (usually 1536)
}
```

**Implementations**:
- `OpenAiHttpEmbeddings`: Direct HTTP to OpenAI (recommended)
- `FakeEmbeddings`: For testing
- `SpringAiEmbeddings`: Optional Spring AI integration

**Configuration**:
```yaml
rag:
  provider:
    embeddings: openai  # or 'fake'
```

### 2. Chat Provider
**Interface**: `ChatLLM`
```java
public interface ChatLLM {
    String answer(String question, List<String> contexts);
}
```

**Implementations**:
- `OpenAiHttpChat`: Direct HTTP to OpenAI (recommended)
- `FakeChat`: For testing
- `SpringAiChat`: Optional Spring AI integration

**Configuration**:
```yaml
rag:
  provider:
    chat: openai  # or 'fake'
```

### 3. Document Chunking
**Class**: `Chunker`
```java
public static List<String> split(String text, int maxLen, int overlap)
```

**Example**:
```java
// Split 10,000 char document into ~1200 char chunks with 200 char overlap
List<String> chunks = Chunker.split(document, 1200, 200);
```

---

## Common Tasks

### Add New Document Format

1. **Add to supported extensions** (ZipIngestService):
```java
if (!List.of("pdf","md","markdown","html","htm","txt","docx").contains(ext)) {
    // Skip unsupported
}
```

2. **Add content type** (ZipIngestService):
```java
private static String contentTypeFor(String ext) {
    return switch (ext) {
        // ... existing cases ...
        case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        default -> "application/octet-stream";
    };
}
```

3. **Add text extraction** (ZipIngestService):
```java
private static String readTextByExt(String ext, byte[] data) throws IOException {
    return switch (ext) {
        // ... existing cases ...
        case "docx" -> extractDocxText(data);  // New method
        default -> "";
    };
}
```

### Modify Chunking Strategy

Edit `application.yml`:
```yaml
rag:
  chunk:
    maxLen: 1500    # Increase for longer contexts
    overlap: 300    # Increase for more overlap
```

Or programmatically:
```java
List<String> chunks = Chunker.split(text, 1500, 300);
```

### Add Custom Embeddings Provider

1. **Create new class**:
```java
@Component
@ConditionalOnProperty(name = "rag.provider.embeddings", havingValue = "custom")
public class CustomEmbeddings implements Embeddings {
    @Override
    public float[] embed(String text) {
        // Your implementation
    }
    
    @Override
    public int dim() {
        return 1536;  // or your dimension
    }
}
```

2. **Enable in config**:
```yaml
rag:
  provider:
    embeddings: custom
```

### Implement Custom Chat Provider

Similar pattern as embeddings:
```java
@Component
@ConditionalOnProperty(name = "rag.provider.chat", havingValue = "custom")
public class CustomChat implements ChatLLM {
    @Override
    public String answer(String question, List<String> contexts) {
        // Your implementation
    }
}
```

---

## Database Operations

### Check PostgreSQL Connection
```bash
docker exec astradesk-rag-mini-db psql -U rag -d rag -c "SELECT version();"
```

### Create pgvector Extension
```bash
docker exec astradesk-rag-mini-db psql -U rag -d rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### View Stored Documents
```bash
docker exec astradesk-rag-mini-db psql -U rag -d rag -c "SELECT id, title, language FROM docs;"
```

### Check Vector Index
```bash
docker exec astradesk-rag-mini-db psql -U rag -d rag << EOF
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'chunks' AND indexname LIKE '%embedding%';
EOF
```

### Analyze Query Performance
```bash
docker exec astradesk-rag-mini-db psql -U rag -d rag << EOF
ANALYZE chunks;
EXPLAIN ANALYZE
SELECT * FROM chunks 
ORDER BY embedding <-> '[0.1, 0.2, ...]'::vector 
LIMIT 5;
EOF
```

---

## Testing

### Run All Tests
```bash
./gradlew test
```

### Run Specific Test Class
```bash
./gradlew test --tests RagServiceTest
```

### Run with Coverage
```bash
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

### Manual API Testing

**Search documents:**
```bash
curl "http://localhost:8080/docs/search?q=AI&k=5"
```

**Ingest ZIP with streaming:**
```bash
curl -X POST \
  -F "file=@documents.zip" \
  -F "collection=my-docs" \
  "http://localhost:8080/ingest/zip" \
  --no-buffer \
  --progress-bar
```

**Check with verbose output:**
```bash
curl -v "http://localhost:8080/docs/search?q=test&k=3" | jq
```

---

## Debugging

### Enable Debug Logging
Add to `application.yml`:
```yaml
logging:
  level:
    com.astradesk.rag: DEBUG
    org.springframework: DEBUG
```

### Run with Debug Port
```bash
./gradlew bootRun --args='--server.port=8080' -Dspring-boot.run.jvmArguments='-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005'
```

### View Application Logs
```bash
docker logs -f astradesk-rag-mini-app
```

### Monitor S3/MinIO
```bash
# MinIO browser: http://localhost:9001
# Credentials: minioadmin / minioadmin
```

---

## Performance Tuning

### Bulk Ingestion
Use single ZIP with many documents:
```bash
zip -r documents.zip /path/to/docs/*
curl -X POST \
  -F "file=@documents.zip" \
  -F "collection=bulk-import" \
  -F "maxLen=1200" \
  -F "overlap=200" \
  "http://localhost:8080/ingest/zip"
```

### Vector Search Optimization
```yaml
# Tune for dataset size
rag:
  chunk:
    maxLen: 1200      # Balance: longer = fewer chunks = faster search
    overlap: 200      # Balance: more overlap = context preservation
  topk: 5             # Limit results
```

### Database Tuning
```bash
# Update table statistics (before large searches)
docker exec astradesk-rag-mini-db psql -U rag -d rag -c "ANALYZE chunks;"

# Monitor index size
docker exec astradesk-rag-mini-db psql -U rag -d rag << EOF
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';
EOF
```

---

## Common Issues & Solutions

### "Cannot find symbol: class ChatModel"
**Cause**: Spring AI API compatibility issue
**Solution**: Use OpenAI HTTP implementation (default) or wait for Spring AI update

### "FATAL: database 'rag' does not exist"
**Solution**:
```bash
docker exec astradesk-rag-mini-db createdb -U rag rag
```

### "SSL certificate problem"
**Solution** (for self-signed certs):
```bash
export SPRING_PROFILES_ACTIVE=dev  # or add to application.yml
```

### "Slow vector searches"
**Solution**: 
1. Check IVFFlat index: `ANALYZE chunks;`
2. Reduce `maxLen` to create fewer chunks
3. Increase PostgreSQL `shared_buffers` if memory available

---

## Build & Deploy

### Build for Production
```bash
./gradlew clean build -DskipTests=true
```

### Create Docker Image
```bash
docker build -t astradesk-rag:1.0 .
docker tag astradesk-rag:1.0 your-registry/astradesk-rag:latest
docker push your-registry/astradesk-rag:latest
```

### Deploy Stack
```bash
docker-compose -f docker-compose.yml up -d
```

### Monitor Application
```bash
# Health check
curl http://localhost:8080/health

# Metrics
curl http://localhost:8080/metrics
```

---

## Code Quality

### Run Quality Checks
```bash
./gradlew check
```

### Format Code
```bash
# If using Google Java Format plugin
./gradlew goJF  # Go JF (format)
```

### Pre-commit Hook
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
./gradlew check || exit 1
```

---

## Resources

- **Spring Boot**: https://spring.io/projects/spring-boot
- **Spring AI**: https://docs.spring.io/spring-ai/reference/
- **pgvector**: https://github.com/pgvector/pgvector
- **OpenAI API**: https://platform.openai.com/docs/guides/embeddings
- **PDFBox**: https://pdfbox.apache.org/

---

## Support & Questions

1. Check README.md for comprehensive documentation
2. Review FIXES_APPLIED.md for known issues
3. Check logs: `docker logs astradesk-rag-mini-app`
4. Search existing issues in repository

---

**Happy Coding! 🚀**