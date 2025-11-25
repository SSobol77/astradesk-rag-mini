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

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
