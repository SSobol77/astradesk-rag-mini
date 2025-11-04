// src/main/java/com/astradesk/rag/service/SpringAiEmbeddings.java

package com.astradesk.rag.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Spring AI Embeddings adapter (optional). Requires spring-ai-openai-spring-boot-starter dependency.
 * Spring AI 0.8.1 API compatibility wrapper. Use OpenAiHttpEmbeddings as fallback.
 */
@Component
@ConditionalOnProperty(name = "spring.ai.enabled", havingValue = "true", matchIfMissing = false)
public class SpringAiEmbeddings implements Embeddings {
    private final int dim;

    public SpringAiEmbeddings() {
        // Embedding dimension is 1536 for text-embedding-3-small
        this.dim = 1536;
    }

    @Override
    public float[] embed(String text) {
        // Spring AI 0.8.1 API integration - to be implemented with correct API version
        throw new UnsupportedOperationException("Spring AI integration requires proper version compatibility");
    }

    @Override
    public int dim() { return dim; }
}
