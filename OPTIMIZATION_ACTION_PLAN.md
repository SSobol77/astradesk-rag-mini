# Optimization Action Plan - Quick Reference

**Target**: 10,000 requests/minute  
**Current**: ~6,000 requests/minute  
**Timeline**: 4 weeks  
**Priority**: High

---

## Week 1: Quick Wins (+33% capacity)

### Day 1-2: Database Optimization

**Task 1.1**: Increase HikariCP Pool Size (1 hour)
```yaml
# src/main/resources/application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50  # Was: 10
      minimum-idle: 10       # Was: 2
      leak-detection-threshold: 60000
```

**Task 1.2**: Optimize IVFFlat Index (1 hour)
```bash
# Run migration script
./scripts/migrate-ivfflat-lists.sh 316

# Or manually:
psql -U rag -d rag << EOF
DROP INDEX idx_chunks_embedding;
CREATE INDEX idx_chunks_embedding 
  ON chunks USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 316);
ANALYZE chunks;
EOF
```

**Task 1.3**: Enable Response Compression (5 minutes)
```yaml
# src/main/resources/application.yml
server:
  compression:
    enabled: true
    mime-types: application/json,text/event-stream
    min-response-size: 1024
```

### Day 3: HTTP Client Optimization

**Task 1.4**: Add OpenAI Connection Pooling (2 hours)
```java
// src/main/java/com/astradesk/rag/config/OpenAiConfig.java
@Configuration
public class OpenAiConfig {
    @Bean
    public RestClient openAiRestClient(@Value("${spring.ai.openai.api-key}") String apiKey) {
        return RestClient.builder()
            .baseUrl("https://api.openai.com")
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .requestFactory(new HttpComponentsClientHttpRequestFactory(
                HttpClients.custom()
                    .setMaxConnTotal(100)
                    .setMaxConnPerRoute(50)
                    .build()
            ))
            .build();
    }
}
```

### Day 4-5: Security & Headers

**Task 1.5**: Add Security Headers (1 hour)
```java
// src/main/java/com/astradesk/rag/config/SecurityHeadersFilter.java
@Component
public class SecurityHeadersFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        exchange.getResponse().getHeaders().add("X-Content-Type-Options", "nosniff");
        exchange.getResponse().getHeaders().add("X-Frame-Options", "DENY");
        exchange.getResponse().getHeaders().add("X-XSS-Protection", "1; mode=block");
        return chain.filter(exchange);
    }
}
```

**Task 1.6**: Add Rate Limit Headers (2 hours)
```java
// Update RateLimitFilter to add headers
response.getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
response.getHeaders().add("X-RateLimit-Remaining", String.valueOf(remaining));
response.getHeaders().add("X-RateLimit-Reset", String.valueOf(resetTime));
```

**Expected Result**: 8,000 req/min ✅

---

## Week 2-3: Major Optimizations (+50% capacity)

### Week 2: R2DBC Migration

**Task 2.1**: Add R2DBC Dependencies (30 minutes)
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql:1.0.2.RELEASE")
    // Remove: spring-boot-starter-jdbc
}
```

**Task 2.2**: Create R2DBC Repositories (2 days)
```java
// src/main/java/com/astradesk/rag/repo/ChunkR2dbcRepository.java
@Repository
public class ChunkR2dbcRepository {
    private final R2dbcEntityTemplate template;
    
    public Flux<ChunkRecord> findSimilar(float[] vector, int limit) {
        return template.getDatabaseClient()
            .sql("SELECT * FROM chunks ORDER BY embedding <=> :vector LIMIT :limit")
            .bind("vector", vector)
            .bind("limit", limit)
            .map(this::mapToChunkRecord)
            .all();
    }
}
```

**Task 2.3**: Update Services (1 day)
```java
// Update RagService to use Flux/Mono
public Mono<List<ChunkRecord>> search(String query, Integer k) {
    float[] v = embeddings.embed(query);
    return chunks.findSimilar(v, k != null ? k : topk)
        .collectList();
}
```

**Task 2.4**: Update Controllers (1 day)
```java
// Update DocumentController
@GetMapping("/search")
public Mono<List<ChunkRecord>> search(@RequestParam String q, @RequestParam(required=false) Integer k) {
    return rag.search(q, k);
}
```

### Week 3: Batch Processing & Caching

**Task 2.5**: Implement Batch Embeddings (2 days)
```java
// src/main/java/com/astradesk/rag/service/BatchEmbeddingService.java
@Service
public class BatchEmbeddingService {
    public List<float[]> embedBatch(List<String> texts) {
        // Call OpenAI batch API
        return openAiClient.createEmbeddings(texts);
    }
}

// Update ZipIngestService
List<float[]> embeddings = batchEmbeddingService.embedBatch(chunks);
chunkRepo.insertBatch(chunks, embeddings);
```

**Task 2.6**: Add Redis Caching (1 day)
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
}
```

```java
// Enable caching
@EnableCaching
@Configuration
public class CacheConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5)))
            .build();
    }
}

// Add to RagService
@Cacheable(value = "search", key = "#query + ':' + #k")
public Mono<List<ChunkRecord>> search(String query, Integer k) {
    // Existing logic
}
```

**Expected Result**: 12,000 req/min ✅

---

## Week 4: Horizontal Scaling & Documentation

### Day 1-2: Horizontal Scaling Setup

**Task 3.1**: Docker Compose for Multiple Instances (1 day)
```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on: [app1, app2, app3]

  app1:
    build: .
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rag
      REDIS_HOST: redis
    depends_on: [db, redis]

  app2:
    build: .
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rag
      REDIS_HOST: redis
    depends_on: [db, redis]

  app3:
    build: .
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rag
      REDIS_HOST: redis
    depends_on: [db, redis]

  db:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_DB: rag
      POSTGRES_USER: rag
      POSTGRES_PASSWORD: rag
      POSTGRES_MAX_CONNECTIONS: 200

  redis:
    image: redis:alpine
    command: redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
```

**Task 3.2**: Nginx Load Balancer Config (1 hour)
```nginx
# nginx.conf
upstream backend {
    least_conn;
    server app1:8080 max_fails=3 fail_timeout=30s;
    server app2:8080 max_fails=3 fail_timeout=30s;
    server app3:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### Day 3-4: API Documentation

**Task 3.3**: Add Swagger UI (1 day)
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.3.0")
}
```

```java
// Add annotations to controllers
@Tag(name = "Documents", description = "Document search operations")
@RestController
public class DocumentController {
    
    @Operation(summary = "Search documents", description = "Semantic search")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Success"),
        @ApiResponse(responseCode = "400", description = "Invalid query")
    })
    @GetMapping("/search")
    public Mono<List<ChunkRecord>> search(
        @Parameter(description = "Search query", required = true) @RequestParam String q,
        @Parameter(description = "Result count", example = "5") @RequestParam(required=false) Integer k
    ) {
        return rag.search(q, k);
    }
}
```

### Day 5: Testing & Validation

**Task 3.4**: Load Testing (1 day)
```bash
# Install k6
brew install k6  # or: apt-get install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100
        { duration: '2m', target: 200 },  // Ramp to 200
        { duration: '5m', target: 200 },  // Stay at 200
        { duration: '2m', target: 0 },    // Ramp down
    ],
};

export default function () {
    let res = http.get('http://localhost/docs/search?q=test&k=5');
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });
    sleep(1);
}
EOF

# Run test
k6 run load-test.js
```

**Expected Result**: 15,000 req/min ✅

---

## Critical Bug Fix (Do First!)

### Fix ProgressEvent Error Field

**File**: `src/main/java/com/astradesk/rag/model/ProgressEvent.java`

**Before**:
```java
public record ProgressEvent(
    String stage, 
    String file, 
    Integer page, 
    Integer processed, 
    Integer total, 
    String message
) {}
```

**After**:
```java
public record ProgressEvent(
    String stage, 
    String file, 
    Integer page, 
    Integer processed, 
    Integer total, 
    String message,
    String error  // ADD THIS
) {}
```

**Update ZipIngestService** to use error field:
```java
// When error occurs
return Flux.just(new ProgressEvent(
    "ERROR", 
    fileName, 
    null, 
    processed, 
    total, 
    "Processing failed",
    e.getMessage()  // ADD THIS
));
```

---

## Verification Checklist

### Week 1 Verification
- [ ] HikariCP pool size = 50 (check logs)
- [ ] IVFFlat lists = 316 (run `\d+ chunks` in psql)
- [ ] Gzip enabled (check response headers)
- [ ] Security headers present (check response headers)
- [ ] Rate limit headers present (check response headers)
- [ ] Load test: 8,000 req/min achieved

### Week 2-3 Verification
- [ ] R2DBC dependencies added
- [ ] All repositories migrated
- [ ] Services return Mono/Flux
- [ ] Controllers return reactive types
- [ ] Redis connected (check logs)
- [ ] Cache hit rate > 30% (check metrics)
- [ ] Batch embeddings working (check logs)
- [ ] Load test: 12,000 req/min achieved

### Week 4 Verification
- [ ] 3 app instances running
- [ ] Nginx load balancing working
- [ ] Swagger UI accessible at /swagger-ui.html
- [ ] OpenAPI spec generated
- [ ] Load test: 15,000 req/min achieved
- [ ] All endpoints documented
- [ ] Error responses documented

---

## Rollback Plan

### If Issues Occur

**Week 1 Changes** (Low Risk):
- Revert application.yml changes
- Restart application

**Week 2-3 Changes** (Medium Risk):
- Keep JDBC dependencies in build.gradle.kts
- Create feature flag for R2DBC
- Gradual migration per endpoint

**Week 4 Changes** (Low Risk):
- Scale down to single instance
- Remove nginx

---

## Success Metrics

### Performance Metrics
- [ ] Search p95 latency < 150ms
- [ ] Ingestion time < 15s per document
- [ ] Throughput > 10,000 req/min
- [ ] Error rate < 0.1%
- [ ] Cache hit rate > 30%

### Quality Metrics
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Zero critical security issues
- [ ] API documentation complete
- [ ] Load tests passing

---

## Cost Estimate

### Development Time
- Week 1: 16 hours (2 days)
- Week 2-3: 80 hours (10 days)
- Week 4: 32 hours (4 days)
- **Total**: 128 hours (16 days)

### Infrastructure Cost (Monthly)
- 3x App instances (4 CPU, 8GB): $300
- PostgreSQL (16 CPU, 32GB): $400
- Redis (4GB): $50
- Load balancer: $50
- **Total**: $800/month

---

## Contact & Support

**Questions**: s.sobolewski@hotmail.com  
**Documentation**: See PERFORMANCE_SCALABILITY_AUDIT.md  
**Integration Report**: See INTEGRATION_AUDIT_REPORT.md

---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
