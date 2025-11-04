# CI/CD Quick Reference Card

## 🚀 Quick Commands

### Local Development
```bash
make build          # Build project
make test           # Run tests
make run            # Start application
make docker-build   # Build Docker image
make docker-run     # Run with docker-compose
```

### GitHub Actions
```bash
# Trigger CI
git push origin main

# Create release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# View status
https://github.com/username/repo/actions
```

### GitLab CI/CD
```bash
# Trigger pipeline
git push origin main

# View status
https://gitlab.com/username/repo/-/pipelines

# Manual deploy
# Go to pipeline → deploy stage → click play button
```

---

## 📋 Required Secrets

### GitHub
```
DOCKER_USERNAME     # Docker Hub username
DOCKER_PASSWORD     # Docker Hub access token
```

### GitLab
```
STAGING_WEBHOOK_URL     # Optional
PRODUCTION_WEBHOOK_URL  # Optional
```

---

## 🔄 Workflows

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Test & Build |
| `release.yml` | Tag `v*` | Release |
| `security.yml` | Push/Weekly | Security Scan |

### GitLab CI/CD

| Stage | Purpose | Manual |
|-------|---------|--------|
| test | Run tests | No |
| build | Build Docker | No |
| deploy | Deploy | Yes |

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Test locally
./gradlew clean build

# Check Java version
java -version  # Should be 21
```

### Tests Fail
```bash
# Run specific test
./gradlew test --tests RagServiceTest

# Start PostgreSQL
docker-compose up -d db
```

### Docker Issues
```bash
# Verify Docker login
docker login

# Test build locally
docker build -t test .

# Check running containers
docker ps
```

---

## 📊 Status Badges

### GitHub Actions
```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
```

### GitLab CI/CD
```markdown
![Pipeline](https://gitlab.com/username/repo/badges/main/pipeline.svg)
```

---

## 🔗 Quick Links

- **GitHub Actions Docs:** https://docs.github.com/actions
- **GitLab CI Docs:** https://docs.gitlab.com/ee/ci/
- **Full Setup Guide:** `CI_CD_SETUP.md`
- **Completion Report:** `CI_CD_COMPLETE.md`
