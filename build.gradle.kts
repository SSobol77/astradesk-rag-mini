plugins {
    id("java")
    id("org.springframework.boot") version "3.4.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "astradesk.rag"
version = "0.2.0"

repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")
    implementation("io.micrometer:micrometer-tracing-bridge-otel")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp")
    implementation("org.postgresql:postgresql:42.7.8")
    implementation("com.pgvector:pgvector:0.1.6")

    // PDF / HTML / MD
    implementation("org.apache.pdfbox:pdfbox:3.0.6")
    implementation("org.jsoup:jsoup:1.21.2")

    // Definition of language
    implementation("com.github.pemistahl:lingua:1.2.2")

    // S3/MinIO (AWS SDK v2)
    implementation("software.amazon.awssdk:s3:2.37.3")

    // Spring AI - POPRAWNA WERSJA I REPOZYTORIUM
    implementation("org.springframework.ai:spring-ai-openai-spring-boot-starter:0.8.1") {
        exclude("org.springframework.cloud", "spring-cloud-function-context")
    }

    implementation("com.fasterxml.jackson.core:jackson-databind:2.20.1")

    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.junit.vintage", module = "junit-vintage-engine")
    }
    testImplementation("org.testcontainers:junit-jupiter:1.21.3")
    testImplementation("org.testcontainers:postgresql:1.21.3")
}

tasks.test {
    useJUnitPlatform()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}