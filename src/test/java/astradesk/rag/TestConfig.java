// src/test/java/astradesk/rag/TestConfig.java
package astradesk.rag;

import com.astradesk.rag.service.ChatLLM;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestConfig {
    @Bean ChatLLM fakeChat() { return new FakeChat(); }
}
