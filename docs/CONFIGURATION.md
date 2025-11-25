# Configuration Guide - AstraDesk RAG Mini

Complete configuration reference for all application settings.

## Configuration Files

### Primary Configuration
- **File**: `src/main/resources/application.yml`
- **Format**: YAML
- **Environment Overrides**: Environment variables take precedence

### Environment Variables
- **File**: `.env` (local development)
- **Example**: `.env.example` (template)
- **Production**: Set via deployment platform

## Application Configuration

### Server Settings

```yaml
server:
  port: 8080
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
```

**Environment Variables**:
```bash
SERVER_PORT=8080
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=100MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=100MB
```

**Options**:
- `server.port`: HTTP port (default: 8080)
- `max-file-size`: Maximum upload file size
- `max-request-size`: Maximum total request size

### Spring Application

```yaml
spring:
  application:
    name: astradesk-rag-mini
```

**Purpose**: Application identifier for monitoring and logging

### Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rag
    username: rag
    password: rag
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

**Environment Variables**:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/rag
SPRING_DATASOURCE_USERNAME=rag
SPRING_DATASOURCE_PASSWORD=rag
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=2
```

**HikariCP Pool Settings**:

| Setting | Default | Description | Tuning |
|---------|---------|-------------|--------|
| `maximum-pool-size` | 10 | Max connections | Increase for high traffic |
| `minimum-idle` | 2 | Min idle connections | Keep low to save resources |
| `connection-timeout` | 30000ms | Wait time for connection | Reduce for fail-fast |
| `idle-timeout` | 600000ms | Idle connection lifetime | Increase for long-running |
| `max-lifetime` | 1800000ms | Max connection lifetime | Match DB timeout |

**Tuning Guidelines**:
- **Low traffic** (<10 req/sec): `maximum-pool-size: 5-10`
- **Medium traffic** (10-100 req/sec): `maximum-pool-size: 10-20`
- **High traffic** (>100 req/sec): `maximum-pool-size: 20-50`

### Schema Initialization

```yaml
spring:
  sql:
    init:
      mode: always
```

**Options**:
- `always`: Run schema.sql on every startup
- `never`: Skip schema initialization
- `embedded`: Only for embedded databases

**Production**: Set to `never` after initial setup

## AI/ML Configuration

### OpenAI Settings

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        options:
          model: gpt-4o-mini
      embedding:
        options:
          model: text-embedding-3-small
```

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Available Models**:

**Chat Models**:
- `gpt-4o-mini`: Fast, cost-effective (recommended)
- `gpt-4o`: More capable, higher cost
- `gpt-4-turbo`: Latest GPT-4 with 128k context
- `gpt-3.5-turbo`: Legacy, lower cost

**Embedding Models**:
- `text-embedding-3-small`: 1536 dimensions (recommended)
- `text-embedding-3-large`: 3072 dimensions (higher quality)
- `text-embedding-ada-002`: Legacy, 1536 dimensions

**Cost Comparison** (as of 2025):
- `text-embedding-3-small`: ~$0.02 per 1M tokens
- `text-embedding-3-large`: ~$0.13 per 1M tokens
- `gpt-4o-mini`: ~$0.15 per 1M input tokens

## RAG Configuration

### Provider Selection

```yaml
rag:
  provider:
    embeddings: springai   # springai | openai | fake
    chat: springai         # springai | openai | fake
```

**Providers**:

| Provider | Description | Use Case |
|----------|-------------|----------|
| `springai` | Spring AI framework | Production (recommended) |
| `openai` | Direct HTTP to OpenAI | Alternative implementation |
| `fake` | Mock responses | Testing, development |

**Environment Variables**:
```bash
RAG_PROVIDER_EMBEDDINGS=springai
RAG_PROVIDER_CHAT=springai
```

### Embedding Configuration

```yaml
rag:
  embedding-dim: 1536
  topk: 5
```

**Settings**:
- `embedding-dim`: Vector dimension (must match model)
  - `text-embedding-3-small`: 1536
  - `text-embedding-3-large`: 3072
- `topk`: Default number of search results

**Environment Variables**:
```bash
RAG_EMBEDDING_DIM=1536
RAG_TOPK=5
```

### Chunking Configuration

```yaml
rag:
  chunk:
    maxLen: 1200
    overlap: 200
```

**Settings**:
- `maxLen`: Maximum characters per chunk
- `overlap`: Overlapping characters between chunks

**Tuning Guidelines**:

| Use Case | maxLen | overlap | Rationale |
|----------|--------|---------|-----------|
| Short documents | 800 | 100 | Preserve context in small docs |
| Standard (default) | 1200 | 200 | Balanced performance |
| Long documents | 1500 | 300 | More context per chunk |
| Technical docs | 1000 | 150 | Preserve code blocks |

**Environment Variables**:
```bash
RAG_CHUNK_MAXLEN=1200
RAG_CHUNK_OVERLAP=200
```

### Security Configuration

```yaml
rag:
  api-key: ${RAG_API_KEY:}
  cors:
    allowed-origins: ${RAG_CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:8080}
```

**API Key**:
- **Empty**: Authentication disabled (default)
- **Set**: Require `X-API-Key` header

**CORS**:
- **Comma-separated list** of allowed origins
- **Wildcard**: Not recommended for production

**Environment Variables**:
```bash
RAG_API_KEY=your-secret-key
RAG_CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### Rate Limiting

```yaml
rag:
  rate-limit:
    enabled: ${RAG_RATE_LIMIT_ENABLED:false}
    requests-per-minute: ${RAG_RATE_LIMIT_RPM:60}
```

**Settings**:
- `enabled`: Enable/disable rate limiting
- `requests-per-minute`: Max requests per API key (or IP)

**Environment Variables**:
```bash
RAG_RATE_LIMIT_ENABLED=true
RAG_RATE_LIMIT_RPM=60
```

**Tuning**:
- **Development**: Disabled
- **Production (light)**: 60 req/min
- **Production (standard)**: 120 req/min
- **Production (heavy)**: 300+ req/min

## S3/MinIO Configuration

```yaml
s3:
  endpoint: ${S3_ENDPOINT:http://localhost:9000}
  region: ${S3_REGION:us-east-1}
  accessKey: ${S3_ACCESS_KEY:minioadmin}
  secretKey: ${S3_SECRET_KEY:minioadmin}
  bucket: ${S3_BUCKET:astradesk-rag}
  pathStyleAccess: true
```

**Environment Variables**:
```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=astradesk-rag
```

**Settings**:
- `endpoint`: S3-compatible endpoint URL
- `region`: AWS region (or any for MinIO)
- `accessKey`: Access key ID
- `secretKey`: Secret access key
- `bucket`: Bucket name for document storage
- `pathStyleAccess`: Use path-style URLs (required for MinIO)

**Providers**:

| Provider | Endpoint | pathStyleAccess |
|----------|----------|-----------------|
| MinIO (local) | `http://localhost:9000` | `true` |
| AWS S3 | `https://s3.amazonaws.com` | `false` |
| DigitalOcean Spaces | `https://nyc3.digitaloceanspaces.com` | `false` |
| Backblaze B2 | `https://s3.us-west-000.backblazeb2.com` | `false` |

## Observability Configuration

### Actuator Endpoints

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

**Exposed Endpoints**:
- `/actuator/health` - Health status
- `/actuator/metrics` - Metrics data
- `/actuator/prometheus` - Prometheus format

**Environment Variables**:
```bash
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,metrics,prometheus
```

**Security Note**: Restrict access to actuator endpoints in production

### Prometheus Metrics

```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
```

**Environment Variables**:
```bash
MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED=true
```

### OpenTelemetry Tracing

```yaml
management:
  tracing:
    sampling:
      probability: 1.0
  otlp:
    tracing:
      endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4318/v1/traces}
```

**Environment Variables**:
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
MANAGEMENT_TRACING_SAMPLING_PROBABILITY=1.0
```

**Settings**:
- `probability`: Sampling rate (0.0-1.0)
  - `1.0`: Sample all requests (development)
  - `0.1`: Sample 10% (production)
  - `0.01`: Sample 1% (high traffic)

**Backends**:
- **Jaeger**: `http://jaeger:4318/v1/traces`
- **Zipkin**: `http://zipkin:9411/api/v2/spans`
- **AWS X-Ray**: Use AWS OTEL Collector
- **Google Cloud Trace**: Use GCP OTEL Collector

## Logging Configuration

### Log Levels

```yaml
logging:
  level:
    com.astradesk.rag: INFO
    org.springframework: WARN
    org.springframework.web: DEBUG
```

**Environment Variables**:
```bash
LOGGING_LEVEL_COM_ASTRADESK_RAG=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK=WARN
```

**Levels**:
- `TRACE`: Very detailed (development only)
- `DEBUG`: Detailed (troubleshooting)
- `INFO`: General information (default)
- `WARN`: Warnings (production)
- `ERROR`: Errors only (production)

### Log Format

```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

**Environment Variables**:
```bash
LOGGING_PATTERN_CONSOLE="%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

### Log File

```yaml
logging:
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 30
```

**Environment Variables**:
```bash
LOGGING_FILE_NAME=logs/application.log
LOGGING_FILE_MAX_SIZE=10MB
LOGGING_FILE_MAX_HISTORY=30
```

## Environment-Specific Configuration

### Development (application-dev.yml)

```yaml
spring:
  config:
    activate:
      on-profile: dev

logging:
  level:
    com.astradesk.rag: DEBUG

rag:
  provider:
    embeddings: fake
    chat: fake
  rate-limit:
    enabled: false
```

**Activate**:
```bash
SPRING_PROFILES_ACTIVE=dev
```

### Production (application-prod.yml)

```yaml
spring:
  config:
    activate:
      on-profile: prod

logging:
  level:
    com.astradesk.rag: INFO
    org.springframework: WARN

rag:
  provider:
    embeddings: springai
    chat: springai
  rate-limit:
    enabled: true
    requests-per-minute: 120

management:
  tracing:
    sampling:
      probability: 0.1
```

**Activate**:
```bash
SPRING_PROFILES_ACTIVE=prod
```

## Configuration Validation

### Required Settings

**Minimum configuration for startup**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rag
    username: rag
    password: rag

s3:
  endpoint: http://localhost:9000
  accessKey: minioadmin
  secretKey: minioadmin
  bucket: astradesk-rag
```

### Optional Settings

**Can be omitted (defaults used)**:
- `rag.topk` (default: 5)
- `rag.chunk.maxLen` (default: 1200)
- `rag.chunk.overlap` (default: 200)
- `rag.api-key` (default: disabled)
- `rag.rate-limit.enabled` (default: false)

### Validation on Startup

Application validates configuration on startup:
- Database connectivity
- S3/MinIO connectivity
- OpenAI API key (if provider is springai/openai)
- Required properties present

**Check logs for**:
```
INFO  c.a.r.App - Started App in 5.123 seconds
INFO  c.a.r.config.S3Config - S3 client configured: http://localhost:9000
INFO  c.a.r.config.ProviderConfig - Using embeddings provider: springai
```

## Configuration Best Practices

### Security
1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Restrict actuator endpoints** in production
5. **Enable HTTPS** in production

### Performance
1. **Tune HikariCP pool** based on traffic
2. **Adjust chunk size** for your documents
3. **Set appropriate topk** values
4. **Configure rate limits** to prevent abuse
5. **Use sampling** for tracing in production

### Reliability
1. **Set connection timeouts** appropriately
2. **Configure retry logic** for external APIs
3. **Monitor health endpoints**
4. **Set up alerts** for failures
5. **Regular backups** of configuration

### Development
1. **Use fake providers** to avoid API costs
2. **Enable debug logging** for troubleshooting
3. **Disable rate limiting** for testing
4. **Use local MinIO** instead of S3
5. **Keep dev config** separate from prod

## Configuration Examples

### Local Development

```yaml
# application-local.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rag
    username: rag
    password: rag

rag:
  provider:
    embeddings: fake
    chat: fake

s3:
  endpoint: http://localhost:9000
  accessKey: minioadmin
  secretKey: minioadmin

logging:
  level:
    com.astradesk.rag: DEBUG
```

### Docker Compose

```yaml
# docker-compose.yml environment
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rag
  SPRING_DATASOURCE_USERNAME: rag
  SPRING_DATASOURCE_PASSWORD: rag
  OPENAI_API_KEY: ${OPENAI_API_KEY}
  S3_ENDPOINT: http://minio:9000
  RAG_PROVIDER_EMBEDDINGS: springai
  RAG_PROVIDER_CHAT: springai
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: astradesk-rag-config
data:
  application.yml: |
    spring:
      datasource:
        url: jdbc:postgresql://postgres:5432/rag
    rag:
      provider:
        embeddings: springai
        chat: springai
      rate-limit:
        enabled: true
        requests-per-minute: 120
    s3:
      endpoint: https://s3.amazonaws.com
      region: us-east-1
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: astradesk-rag-secrets
type: Opaque
stringData:
  SPRING_DATASOURCE_PASSWORD: your-db-password
  OPENAI_API_KEY: sk-your-api-key
  S3_ACCESS_KEY: your-access-key
  S3_SECRET_KEY: your-secret-key
  RAG_API_KEY: your-api-key
```

## Troubleshooting Configuration

### Database Connection Issues

**Error**: `Connection refused`

**Check**:
```bash
# Verify database is running
docker ps | grep postgres

# Test connection
psql -h localhost -U rag -d rag -c "SELECT 1"
```

**Fix**:
- Ensure PostgreSQL is running
- Check `SPRING_DATASOURCE_URL` is correct
- Verify network connectivity

### S3/MinIO Connection Issues

**Error**: `Unable to execute HTTP request`

**Check**:
```bash
# Verify MinIO is running
docker ps | grep minio

# Test connection
curl http://localhost:9000/minio/health/live
```

**Fix**:
- Ensure MinIO/S3 is accessible
- Check `S3_ENDPOINT` is correct
- Verify credentials are valid

### OpenAI API Issues

**Error**: `Incorrect API key provided`

**Check**:
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Fix**:
- Set `OPENAI_API_KEY` environment variable
- Verify API key is valid
- Check API key has sufficient credits

### Configuration Not Loading

**Error**: Properties not taking effect

**Check**:
1. Verify file location: `src/main/resources/application.yml`
2. Check YAML syntax (indentation matters)
3. Verify environment variables are set
4. Check active profile: `SPRING_PROFILES_ACTIVE`

**Debug**:
```bash
# Enable configuration logging
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT_CONTEXT_CONFIG=DEBUG
```


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
