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

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
