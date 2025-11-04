// src/main/java/com/astradesk/rag/service/SpringAiChat.java

package com.astradesk.rag.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Spring AI Chat adapter (optional). Implement this using OpenAiHttpChat as fallback.
 */
@Component
@ConditionalOnProperty(name = "spring.ai.enabled", havingValue = "true", matchIfMissing = false)
public class SpringAiChat implements ChatLLM {

    public SpringAiChat() {
    }

    @Override
    public String answer(String question, List<String> contexts) {
        StringBuilder ctx = new StringBuilder();
        for (int i = 0; i < contexts.size(); i++) {
            ctx.append("[Doc ").append(i+1).append("]\n").append(contexts.get(i)).append("\n\n");
        }
        // Spring AI 0.8.1 API integration - to be implemented with correct API version
        // For now, fall back to OpenAI HTTP implementation
        return "Spring AI integration requires proper version compatibility";
    }
}