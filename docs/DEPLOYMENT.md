# Deployment Guide - AstraDesk RAG Mini

Production deployment guide for various platforms and environments.

## Prerequisites

- Java 21 LTS
- PostgreSQL 16+ with pgvector extension
- S3-compatible object storage
- OpenAI API key (for production)
- 2GB+ RAM, 2+ CPU cores

## Quick Deployment Options

### 1. Docker Compose (Recommended for Getting Started)

**Start all services**:
```bash
# Clone repository
git clone <repository-url>
cd astradesk-rag-mini

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Verify health
curl http://localhost:8080/health
```

**docker-compose.yml**:
```yaml
version: "3.9"
services:
  db:
    image: pgvector/pgvector:0.8.1-pg17-bookworm
    environment:
      POSTGRES_DB: rag
      POSTGRES_USER: rag
      POSTGRES_PASSWORD: rag
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rag -d rag"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rag
      SPRING_DATASOURCE_USERNAME: rag
      SPRING_DATASOURCE_PASSWORD: rag
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      RAG_PROVIDER_EMBEDDINGS: springai
      RAG_PROVIDER_CHAT: springai
    ports: ["8080:8080"]

volumes:
  pgdata:
```

### 2. Standalone JAR

**Build**:
```bash
./gradlew clean bootJar
```

**Run**:
```bash
java -jar build/libs/astradesk-rag-mini-0.2.0.jar \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/rag \
  --spring.datasource.username=rag \
  --spring.datasource.password=rag \
  --spring.ai.openai.api-key=$OPENAI_API_KEY
```

### 3. Docker Image

**Build**:
```bash
docker build -t astradesk-rag:latest .
```

**Run**:
```bash
docker run -d \
  --name astradesk-rag \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/rag \
  -e SPRING_DATASOURCE_USERNAME=rag \
  -e SPRING_DATASOURCE_PASSWORD=rag \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  astradesk-rag:latest
```

## Production Deployments

### Kubernetes

**Prerequisites**:
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3+ (optional)

**1. Create Namespace**:
```bash
kubectl create namespace astradesk-rag
```

**2. Create Secrets**:
```bash
kubectl create secret generic astradesk-rag-secrets \
  --from-literal=database-password=your-db-password \
  --from-literal=openai-api-key=sk-your-key \
  --from-literal=s3-access-key=your-access-key \
  --from-literal=s3-secret-key=your-secret-key \
  -n astradesk-rag
```

**3. Deploy PostgreSQL** (using Helm):
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
  --set auth.username=rag \
  --set auth.password=rag \
  --set auth.database=rag \
  --set image.tag=16 \
  -n astradesk-rag
```

**4. Deploy Application**:

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: astradesk-rag
  namespace: astradesk-rag
spec:
  replicas: 3
  selector:
    matchLabels:
      app: astradesk-rag
  template:
    metadata:
      labels:
        app: astradesk-rag
    spec:
      containers:
      - name: app
        image: your-registry/astradesk-rag:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:postgresql://postgresql:5432/rag
        - name: SPRING_DATASOURCE_USERNAME
          value: rag
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: astradesk-rag-secrets
              key: database-password
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: astradesk-rag-secrets
              key: openai-api-key
        - name: RAG_RATE_LIMIT_ENABLED
          value: "true"
        - name: RAG_RATE_LIMIT_RPM
          value: "120"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5

---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
