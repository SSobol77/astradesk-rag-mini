# Security Guide - AstraDesk RAG Mini

Security best practices, configuration, and guidelines for production deployment.

## Security Features

### Authentication
- **API Key Authentication**: Optional header-based authentication
- **Implementation**: WebFlux WebFilter
- **Configuration**: `rag.api-key` property

### Rate Limiting
- **Algorithm**: Token bucket
- **Tracking**: Per API key or IP address
- **Configuration**: `rag.rate-limit.*` properties
- **Storage**: In-memory (Redis-ready)

### CORS Protection
- **Configurable Origins**: Whitelist allowed domains
- **Default**: localhost only
- **Configuration**: `rag.cors.allowed-origins`

### File Upload Security
- **Max Size**: 100MB (configurable)
- **Type Validation**: ZIP files only
- **Content Scanning**: Validates ZIP structure

### Secrets Management
- **Environment Variables**: All sensitive data
- **No Hardcoding**: Enforced in code reviews
- **External Secrets**: Kubernetes Secrets, AWS Secrets Manager

## Configuration

### Enable API Key Authentication

**application.yml**:
```yaml
rag:
  api-key: ${RAG_API_KEY:}
```

**Environment Variable**:
```bash
export RAG_API_KEY=your-secret-api-key-here
```

**Usage**:
```bash
curl -H "X-API-Key: your-secret-api-key-here" \
  "http://localhost:8080/docs/search?q=test"
```

### Enable Rate Limiting

**application.yml**:
```yaml
rag:
  rate-limit:
    enabled: true
    requests-per-minute: 60
```

**Environment Variables**:
```bash
export RAG_RATE_LIMIT_ENABLED=true
export RAG_RATE_LIMIT_RPM=60
```

### Configure CORS

**application.yml**:
```yaml
rag:
  cors:
    allowed-origins: https://app.example.com,https://admin.example.com
```

**Environment Variable**:
```bash
export RAG_CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### Restrict Actuator Endpoints

**application.yml**:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
```

**Kubernetes Network Policy**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: astradesk-rag-actuator
spec:
  podSelector:
    matchLabels:
      app: astradesk-rag
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: prometheus
    ports:
    - protocol: TCP
      port: 8080
```

## Best Practices

### 1. Use HTTPS/TLS

**Never expose HTTP in production**

**Kubernetes Ingress with TLS**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: astradesk-rag-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: astradesk-rag-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: astradesk-rag
            port:
              number: 80
```

### 2. Rotate API Keys Regularly

**Recommended**: Every 90 days

**Process**:
1. Generate new API key
2. Update clients with new key
3. Monitor usage of old key
4. Deprecate old key after grace period
5. Remove old key

### 3. Use Secrets Management

**AWS Secrets Manager**:
```bash
# Store secret
aws secretsmanager create-secret \
  --name astradesk-rag/openai-key \
  --secret-string "sk-your-key"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id astradesk-rag/openai-key \
  --query SecretString \
  --output text
```

**Kubernetes Secrets**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: astradesk-rag-secrets
type: Opaque
stringData:
  openai-api-key: sk-your-key
  database-password: your-db-password
```

**HashiCorp Vault**:
```bash
# Store secret
vault kv put secret/astradesk-rag \
  openai-key=sk-your-key \
  db-password=your-password

# Retrieve in application
vault kv get -field=openai-key secret/astradesk-rag
```

### 4. Implement Network Segmentation

**Kubernetes Network Policies**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: astradesk-rag-network-policy
spec:
  podSelector:
    matchLabels:
      app: astradesk-rag
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS for OpenAI API
```

### 5. Enable Audit Logging

**application.yml**:
```yaml
logging:
  level:
    com.astradesk.rag.config.RequestLoggingFilter: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

**Log Format**:
```
2025-01-24 10:30:00 [reactor-http-nio-2] INFO  RequestLoggingFilter - 
  method=GET uri=/docs/search ip=192.168.1.100 user-agent=curl/7.68.0
```

### 6. Implement Input Validation

**Already Implemented**:
- File type validation (ZIP only)
- File size limits (100MB)
- Query parameter validation
- SQL injection prevention (JdbcTemplate)

**Additional Recommendations**:
- Sanitize user input
- Validate chunk parameters (maxLen, overlap)
- Limit search result count

### 7. Regular Security Updates

**Dependency Scanning**:
```bash
# Gradle dependency check
./gradlew dependencyCheckAnalyze

# OWASP Dependency Check
./gradlew dependencyCheckAggregate
```

**Container Scanning**:
```bash
# Trivy
trivy image astradesk-rag:latest

# Snyk
snyk container test astradesk-rag:latest
```

### 8. Implement Security Headers

**Spring Security Configuration** (optional):
```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .headers(headers -> headers
                .contentSecurityPolicy("default-src 'self'")
                .frameOptions().deny()
                .xssProtection().enable()
            )
            .build();
    }
}
```

**Headers to Add**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

## Vulnerability Management

### Dependency Scanning

**GitHub Dependabot** (.github/dependabot.yml):
```yaml
version: 2
updates:
  - package-ecosystem: "gradle"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

**Snyk Integration**:
```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Monitor for vulnerabilities
snyk monitor
```

### Container Security

**Multi-stage Dockerfile** (already implemented):
```dockerfile
FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:21
ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:MaxRAMPercentage=75.0"
WORKDIR /opt/app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
```

**Best Practices**:
- Use official base images
- Minimize layers
- Don't run as root
- Scan images regularly
- Use specific tags (not `latest`)

### Database Security

**PostgreSQL Configuration**:
```sql
-- Create dedicated user with limited privileges
CREATE USER rag_app WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE rag TO rag_app;
GRANT USAGE ON SCHEMA public TO rag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rag_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rag_app;

-- Revoke unnecessary privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

**Connection Security**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rag?ssl=true&sslmode=require
    username: rag_app
    password: ${DB_PASSWORD}
```

**Encryption at Rest**:
- Enable PostgreSQL encryption
- Use encrypted EBS volumes (AWS)
- Use encrypted persistent disks (GCP)

### S3/Object Storage Security

**Bucket Policy** (AWS S3):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account-id:role/astradesk-rag-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::astradesk-rag/*"
    }
  ]
}
```

**IAM Role** (AWS):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::astradesk-rag/*"
    }
  ]
}
```

**Encryption**:
- Enable server-side encryption (SSE-S3 or SSE-KMS)
- Use HTTPS for all transfers
- Enable versioning for backup

## Compliance

### GDPR Considerations

**Data Handling**:
- Document content may contain PII
- Implement data retention policies
- Provide data deletion capabilities
- Log access to sensitive data

**Implementation**:
```sql
-- Delete user data
DELETE FROM chunks WHERE doc_id IN (
  SELECT id FROM docs WHERE title LIKE '%user-email%'
);
DELETE FROM docs WHERE title LIKE '%user-email%';

-- Anonymize logs
-- Implement log rotation and deletion
```

### HIPAA Considerations

**If handling healthcare data**:
- Enable encryption at rest and in transit
- Implement audit logging
- Use BAA-compliant cloud providers
- Restrict access to authorized personnel
- Regular security assessments

### SOC 2 Considerations

**Controls to Implement**:
- Access control (API keys)
- Encryption (TLS, database encryption)
- Monitoring and logging
- Incident response procedures
- Regular security reviews

## Incident Response

### Security Incident Checklist

1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze logs and traces
4. **Remediate**: Apply fixes and patches
5. **Recover**: Restore from backups if needed
6. **Review**: Post-incident analysis

### Monitoring for Security Events

**Alerts to Configure**:
- Failed authentication attempts
- Rate limit violations
- Unusual traffic patterns
- Database connection failures
- Unauthorized access attempts

**Example Alert** (Prometheus):
```yaml
groups:
- name: security
  rules:
  - alert: HighFailedAuthRate
    expr: rate(http_server_requests_seconds_count{status="401"}[5m]) > 10
    for: 5m
    annotations:
      summary: "High rate of failed authentication attempts"
```

### Backup and Recovery

**Regular Backups**:
```bash
# Database backup (daily)
0 2 * * * pg_dump -h localhost -U rag -d rag | gzip > /backups/rag-$(date +\%Y\%m\%d).sql.gz

# S3 backup (weekly)
0 3 * * 0 aws s3 sync s3://astradesk-rag s3://astradesk-rag-backup
```

**Test Restores**:
```bash
# Test database restore
psql -h localhost -U rag -d rag_test < backup.sql

# Verify data integrity
psql -h localhost -U rag -d rag_test -c "SELECT COUNT(*) FROM chunks;"
```

## Security Checklist

### Development
- [ ] No hardcoded secrets in code
- [ ] Use environment variables for configuration
- [ ] Implement input validation
- [ ] Use parameterized queries (JdbcTemplate)
- [ ] Enable CORS only for trusted origins
- [ ] Implement rate limiting

### Deployment
- [ ] Use HTTPS/TLS in production
- [ ] Enable API key authentication
- [ ] Configure rate limiting
- [ ] Restrict actuator endpoints
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Enable network policies (Kubernetes)
- [ ] Configure security headers
- [ ] Enable audit logging

### Operations
- [ ] Regular security updates
- [ ] Dependency scanning (Snyk, Dependabot)
- [ ] Container scanning (Trivy)
- [ ] Monitor security events
- [ ] Regular backups
- [ ] Test disaster recovery
- [ ] Rotate API keys (90 days)
- [ ] Review access logs

### Compliance
- [ ] Document data handling procedures
- [ ] Implement data retention policies
- [ ] Enable encryption at rest and in transit
- [ ] Configure audit logging
- [ ] Regular security assessments
- [ ] Incident response plan
- [ ] Employee security training

## Security Contacts

**Report Security Issues**:
- Email: s.sobolewski@hotmail.com
- Subject: [SECURITY] AstraDesk RAG Mini

**Response Time**:
- Critical: 24 hours
- High: 48 hours
- Medium: 1 week
- Low: 2 weeks

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
