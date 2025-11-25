package com.astradesk.rag;

import com.astradesk.rag.service.ChatLLM;
import org.springframework.web.client.RestClient;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

@Configuration
public class TestConfig {
    // Provide a minimal RestClient.Builder to satisfy Spring AI autoconfiguration in tests
    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
