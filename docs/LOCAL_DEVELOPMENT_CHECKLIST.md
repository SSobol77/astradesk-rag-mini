# Local Development Checklist

Minimal checklist to get the project running locally and exact build-specific versions used by the project.

## Required Software (explicit build versions)
- Java: Temurin/OpenJDK 21 (tested)
	- NOTE: If your system Java is newer (for example Java 25) you may see an error during Gradle script evaluation (e.g. `IllegalArgumentException: 25.0.1`). The Gradle/Kotlin tooling requires Java 21 for the Gradle runtime. See Troubleshooting in `README.md` for install/workaround commands (SDKMAN, package manager, or Docker fallback).
- Gradle: 8.14 (wrapper provided: `./gradlew`)
- Docker: 20.10+ and Docker Compose v2
- Node.js: 20.x (for frontend dev; Next.js 15 requires Node 18+ but use Node 20 for parity)
- pnpm or npm for frontend (see `ui/astradesk-admin-panel-main/package.json`)
- PostgreSQL-compatible container with pgvector: `pgvector/pgvector:pg16`

## Environment variables (minimum)
- `OPENAI_API_KEY` (optional for local testing with OpenAI)
- `S3_ENDPOINT` (default: `http://localhost:9000` for MinIO)
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET`
- `SPRING_DATASOURCE_URL` (optional, default in `application.yml`) e.g. `jdbc:postgresql://localhost:5432/rag`

## Quick Local Setup (recommended)

```bash
# Clone
git clone <repo> && cd astradesk-rag-mini

# Start local infra: PostgreSQL (pgvector) + MinIO
# Uses docker-compose in repo
docker-compose up -d postgres minio

# Build backend
./gradlew clean build

# Run tests
./gradlew test

# Run app
./gradlew bootRun
```

## Frontend (optional)

```bash
cd ui/astradesk-admin-panel-main
# install deps (pnpm recommended if present)
pnpm install
pnpm dev
```

## Notes & Troubleshooting
- The project uses `text-embedding-3-small` (1536 dims). If you change model to a different dimension, update `src/main/resources/schema.sql` and re-ingest embeddings.
- The schema migration creates the `vector` extension; ensure the PostgreSQL instance supports pgvector.
- If you run into file upload size issues, increase `server.servlet.multipart.max-file-size` in `application.yml`.

## Useful Commands
- Run only the database container for fast dev:

```bash
# start only postgres
docker-compose up -d postgres

# check postgres logs
docker-compose logs -f postgres
```

- Reindex IVFFlat lists (see docs/DATABASE_TUNING_GUIDE.md):
```bash
./scripts/migrate-ivfflat-lists.sh 200
```

**Last Updated:** 2025-24-11

---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
