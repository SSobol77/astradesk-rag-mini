.PHONY: help build test clean run docker-build docker-run docker-stop deploy

help:
	@echo "AstraDesk RAG Mini - Makefile Commands"
	@echo "======================================"
	@echo "build          - Build the project"
	@echo "test           - Run tests"
	@echo "clean          - Clean build artifacts"
	@echo "run            - Run the application"
	@echo "docker-build   - Build Docker image"
	@echo "docker-run     - Run Docker container"
	@echo "docker-stop    - Stop Docker container"
	@echo "deploy         - Deploy to production"

build:
	./gradlew clean build -x test

test:
	./gradlew test --tests com.astradesk.rag.service.RagServiceTest

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

deploy:
	@echo "Deploying to production..."
	docker build -t astradesk-rag:$(shell git rev-parse --short HEAD) .
	docker push astradesk-rag:$(shell git rev-parse --short HEAD)
