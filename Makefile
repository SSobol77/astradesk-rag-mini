.PHONY: help build test clean run docker-build docker-run docker-stop build-in-docker test-in-docker deploy

help:
	@echo "AstraDesk RAG Mini - Makefile Commands"
	@echo "======================================"
	@echo "build            - Build the project"
	@echo "test             - Run tests"
	@echo "clean            - Clean build artifacts"
	@echo "run              - Run the application"
	@echo "docker-build     - Build Docker image"
	@echo "docker-run       - Run with docker-compose"
	@echo "docker-stop      - Stop docker-compose"
	@echo "build-in-docker  - Build inside Docker (JDK 21)"
	@echo "test-in-docker   - Test inside Docker (JDK 21)"
	@echo "deploy           - Deploy to production"

build:
	./gradlew clean build -x test

test:
	./gradlew test

clean:
	./gradlew clean
	rm -rf build/

run:
	./gradlew bootRun

docker-build:
	docker build -t astradesk-rag:latest .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

build-in-docker:
	@echo "Building inside Docker (JDK 21)..."
	@docker run --rm -v "$$PWD":/workspace -w /workspace eclipse-temurin:21-jdk ./gradlew clean build -x test

test-in-docker:
	@echo "Testing inside Docker (JDK 21)..."
	@docker run --rm -v "$$PWD":/workspace -w /workspace eclipse-temurin:21-jdk ./gradlew test

deploy:
	@echo "Deploying to production..."
	docker build -t astradesk-rag:$$(git rev-parse --short HEAD) .
	docker push astradesk-rag:$$(git rev-parse --short HEAD)
