// src/test/java/astradesk/rag/RagServiceTest.java
package astradesk.rag;

import com.astradesk.rag.model.ChunkRecord;
import com.astradesk.rag.service.RagService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

@SpringBootTest
@Testcontainers
@ContextConfiguration(classes = TestConfig.class)
public class RagServiceTest {
    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("pgvector/pgvector:pg16")
            .withDatabaseName("rag").withUsername("rag").withPassword("rag");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }

    @Autowired RagService rag;

    @Test
    void searchWorks() {
        // Smoke: с фейковыми эмбеддингами просто проверим, что поиск не падает
        List<ChunkRecord> res = rag.search("Spring AI gateway", 3);
        Assertions.assertNotNull(res);
    }
}
