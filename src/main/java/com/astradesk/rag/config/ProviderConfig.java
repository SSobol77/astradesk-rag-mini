// src/main/java/com/astradesk/rag/config/ProviderConfig.java
package com.astradesk.rag.config;

import com.astradesk.rag.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProviderConfig {

    @Bean
    @ConditionalOnProperty(name = "rag.provider.embeddings", havingValue = "springai", matchIfMissing = true)
    public Embeddings embSpring(SpringAiEmbeddings impl) { return impl; }

    @Bean
    @ConditionalOnProperty(name = "rag.provider.embeddings", havingValue = "openai")
    public Embeddings embOpenAi(OpenAiHttpEmbeddings impl) { return impl; }

    @Bean
    @ConditionalOnProperty(name = "rag.provider.embeddings", havingValue = "fake")
    public Embeddings embFake(@Value("${rag.embedding-dim:1536}") int dim) {
        return new Embeddings() {
            @Override
            public float[] embed(String text) {
                // Generate reproducible fake embeddings from text hash
                float[] result = new float[dim];
                int hash = text != null ? text.hashCode() : 0;
                for (int i = 0; i < dim; i++) {
                    hash = (hash * 31) ^ (i & 0xFF);
                    result[i] = ((hash & 0x7FFF) / 32768.0f) - 0.5f;
                }
                return result;
            }

            @Override
            public int dim() { return dim; }
        };
    }

    @Bean
    @ConditionalOnProperty(name = "rag.provider.chat", havingValue = "springai", matchIfMissing = true)
    public ChatLLM chatSpring(SpringAiChat impl) { return impl; }

    @Bean
    @ConditionalOnProperty(name = "rag.provider.chat", havingValue = "openai")
    public ChatLLM chatOpenAi(OpenAiHttpChat impl) { return impl; }

    @Bean
    @ConditionalOnProperty(name = "rag.provider.chat", havingValue = "fake")
    public ChatLLM chatFake() { return (q, ctxs) -> "FAKE_ANSWER:" + q; }
}
