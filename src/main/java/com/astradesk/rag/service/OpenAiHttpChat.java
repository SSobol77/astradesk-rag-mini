// src/main/java/com/astradesk/rag/service/OpenAiHttpChat.java
package com.astradesk.rag.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Component
public class OpenAiHttpChat implements ChatLLM {
    private final WebClient http;
    private final String model;

    public OpenAiHttpChat(
            @Value("${spring.ai.openai.chat.options.model:gpt-4o-mini}") String model,
            @Value("${OPENAI_API_KEY:}") String apiKey) {
        this.model = model;
        this.http = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public String answer(String question, List<String> contexts) {
        StringBuilder ctx = new StringBuilder();
        for (int i=0;i<contexts.size();i++)
            ctx.append("[Doc ").append(i+1).append("]\n").append(contexts.get(i)).append("\n\n");

        String system = "You are a concise enterprise assistant (AstraDesk). " +
                "Answer using only the provided context, cite [Doc i].";
        String user = "Context:\n"+ctx+"\nQuestion: "+question;

        // DTOs
        record Msg(String role, String content){}
        record Req(String model, List<Msg> messages){}
        record Choice(@JsonProperty("message") Msg message){}
        record Resp(List<Choice> choices){}

        Resp resp = http.post().uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(new Req(model, List.of(
                        new Msg("system", system), new Msg("user", user)))))
                .retrieve().bodyToMono(Resp.class).block();
        return resp.choices().get(0).message().content();
    }
}
