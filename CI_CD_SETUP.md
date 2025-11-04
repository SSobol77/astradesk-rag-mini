# CI/CD Setup Guide

## Overview

This project includes CI/CD pipelines for both GitHub Actions and GitLab CI/CD.

---

## GitHub Actions

### Workflows

#### 1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Triggers:** Push/PR to `main` or `develop`
- **Jobs:**
  - `test`: Run unit tests with PostgreSQL service
  - `build-docker`: Build and push Docker image

#### 2. **Release** (`.github/workflows/release.yml`)
- **Triggers:** Push tags matching `v*`
- **Jobs:**
  - Build JAR
  - Build and push versioned Docker image
  - Create GitHub release with artifacts

#### 3. **Security Scan** (`.github/workflows/security.yml`)
- **Triggers:** Push to main/develop, weekly schedule
- **Jobs:**
  - Dependency vulnerability check
  - Trivy filesystem scan

### Required Secrets

Configure in **Settings → Secrets and variables → Actions**:

```bash
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-token
```

### Setup Steps

1. **Fork/Clone repository**
2. **Add secrets** to GitHub repository
3. **Push to trigger** workflows
4. **Monitor** in Actions tab

---

## GitLab CI/CD

### Pipeline Stages

1. **test**: Run tests with PostgreSQL service
2. **build**: Build Docker image and push to registry
3. **deploy**: Deploy to staging/production (manual)

### Required Variables

Configure in **Settings → CI/CD → Variables**:

```bash
CI_REGISTRY=registry.gitlab.com
CI_REGISTRY_USER=gitlab-ci-token
CI_REGISTRY_PASSWORD=$CI_JOB_TOKEN (auto-provided)
STAGING_WEBHOOK_URL=https://your-staging-webhook
PRODUCTION_WEBHOOK_URL=https://your-production-webhook
```

### Setup Steps

1. **Push `.gitlab-ci.yml`** to repository
2. **Configure variables** in GitLab
3. **Enable GitLab Container Registry**
4. **Pipeline runs automatically** on push

---

## Docker Registry Setup

### Docker Hub (GitHub Actions)

1. Create Docker Hub account
2. Generate access token: **Account Settings → Security → New Access Token**
3. Add to GitHub secrets

### GitLab Container Registry

1. Automatically available for GitLab projects
2. Access at: `registry.gitlab.com/username/project`
3. No additional setup required

---

## Local Testing

### Test GitHub Actions Locally

Install [act](https://github.com/nektos/act):

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act -j test
```

### Test GitLab CI Locally

Install [gitlab-runner](https://docs.gitlab.com/runner/install/):

```bash
# Install gitlab-runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# Run pipeline locally
gitlab-runner exec docker test
```

---

## Pipeline Customization

### Modify Test Stage

Edit test commands in workflows:

**GitHub Actions:**
```yaml
- name: Run tests
  run: ./gradlew test
```

**GitLab CI:**
```yaml
script:
  - ./gradlew test
```

### Add Environment Variables

**GitHub Actions:**
```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**GitLab CI:**
```yaml
variables:
  OPENAI_API_KEY: $OPENAI_API_KEY
```

### Change Docker Registry

**GitHub Actions:**
```yaml
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

**GitLab CI:**
```yaml
before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
```

---

## Deployment Strategies

### Manual Deployment

Both pipelines include manual deployment steps:

**GitHub Actions:**
```yaml
when: manual
```

**GitLab CI:**
```yaml
when: manual
```

### Automatic Deployment

Remove `when: manual` for automatic deployment on merge.

### Blue-Green Deployment

Add to deployment stage:

```yaml
script:
  - kubectl set image deployment/rag-app rag=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  - kubectl rollout status deployment/rag-app
```

---

## Monitoring & Notifications

### GitHub Actions

Add Slack notification:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI

Configure in **Settings → Integrations → Slack**

---

## Troubleshooting

### Tests Failing

```bash
# Check logs
GitHub: Actions tab → Failed workflow → test job
GitLab: CI/CD → Pipelines → Failed pipeline → test stage

# Run locally
./gradlew test --tests com.astradesk.rag.service.RagServiceTest
```

### Docker Build Failing

```bash
# Test locally
docker build -t astradesk-rag:test .

# Check Dockerfile syntax
docker build --no-cache -t astradesk-rag:test .
```

### Registry Push Failing

```bash
# Verify credentials
docker login

# Check image name
docker images | grep astradesk-rag
```

---

## Best Practices

1. **Use caching** for dependencies (Gradle, Docker layers)
2. **Run tests in parallel** when possible
3. **Use matrix builds** for multiple Java versions
4. **Implement branch protection** rules
5. **Require status checks** before merge
6. **Use semantic versioning** for releases
7. **Scan for vulnerabilities** regularly
8. **Keep secrets secure** - never commit them

---

## Advanced Configuration

### Multi-Architecture Builds

```yaml
- name: Build multi-arch image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ secrets.DOCKER_USERNAME }}/astradesk-rag:latest
```

### Kubernetes Deployment

```yaml
deploy-k8s:
  stage: deploy
  script:
    - kubectl apply -f k8s/deployment.yml
    - kubectl rollout status deployment/astradesk-rag
  only:
    - main
```

### Helm Chart Deployment

```yaml
deploy-helm:
  stage: deploy
  script:
    - helm upgrade --install astradesk-rag ./helm-chart
  only:
    - main
```

---

## Performance Optimization

### Gradle Build Cache

```yaml
cache:
  paths:
    - .gradle/wrapper
    - .gradle/caches
```

### Docker Layer Caching

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Parallel Test Execution

```gradle
tasks.test {
    maxParallelForks = Runtime.runtime.availableProcessors()
}
```

---

## Security Considerations

1. **Use secrets** for sensitive data
2. **Scan dependencies** regularly
3. **Use minimal base images**
4. **Run as non-root** in containers
5. **Enable branch protection**
6. **Require code review**
7. **Use signed commits**
8. **Rotate credentials** regularly

---

## Support

- **GitHub Actions Docs:** https://docs.github.com/actions
- **GitLab CI Docs:** https://docs.gitlab.com/ee/ci/
- **Docker Docs:** https://docs.docker.com/

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0
