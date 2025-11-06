package com.astradesk.rag.integration;

import com.astradesk.rag.model.ChunkRecord;
import com.astradesk.rag.repo.ChunkJdbcRepository;
import com.astradesk.rag.repo.DocumentJdbcRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
class RagIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("pgvector/pgvector:pg16")
            .withDatabaseName("rag")
            .withUsername("rag")
            .withPassword("rag");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("rag.provider.embeddings", () -> "fake");
        registry.add("rag.provider.chat", () -> "fake");
    }

    @Autowired
    private DocumentJdbcRepository docRepo;

    @Autowired
    private ChunkJdbcRepository chunkRepo;

    @Test
    void testDocumentIngestion() {
        long docId = docRepo.insertDoc("test.pdf", "en");
        assertTrue(docId > 0);
    }

    @Test
    void testChunkStorage() {
        long docId = docRepo.insertDoc("test.pdf", "en");
        float[] embedding = new float[1536];
        for (int i = 0; i < embedding.length; i++) {
            embedding[i] = (float) Math.random();
        }
        
        long chunkId = chunkRepo.insertChunk(docId, 0, 1, 1, "s3://test", "Test content", embedding);
        assertTrue(chunkId > 0);
    }

    @Test
    void testVectorSearch() {
        long docId = docRepo.insertDoc("test.pdf", "en");
        float[] embedding = new float[1536];
        for (int i = 0; i < embedding.length; i++) {
            embedding[i] = (float) Math.random();
        }
        
        chunkRepo.insertChunk(docId, 0, 1, 1, "s3://test", "Test content", embedding);
        
        List<ChunkRecord> results = chunkRepo.findSimilar(embedding, 5);
        assertNotNull(results);
        assertFalse(results.isEmpty());
    }
}
