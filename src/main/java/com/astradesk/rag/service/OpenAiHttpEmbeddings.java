// src/main/java/com/astradesk/rag/service/OpenAiHttpEmbeddings.java
package com.astradesk.rag.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

/**
 * Lekki klient HTTP do OpenAI Embeddings API przez WebClient (bez Spring AI).
 * Używany, gdy rag.provider.embeddings=openai.
 */
@Component
public class OpenAiHttpEmbeddings implements Embeddings {
    private final WebClient http;
    private final ObjectMapper mapper;
    private final String model;
    private final int dim;

    public OpenAiHttpEmbeddings(
            @Value("${spring.ai.openai.embedding.options.model:text-embedding-3-small}") String model,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            ObjectMapper mapper) {
        this.model = model;
        this.mapper = mapper;
        this.http = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.dim = 1536; // zgodny z text-embedding-3-small
    }

    @Override
    public float[] embed(String text) {
        record EmbReq(String model, List<String> input) {}
        record EmbData(@JsonProperty("embedding") List<Double> embedding) {}
        record EmbResp(@JsonProperty("data") List<EmbData> data) {}
        EmbResp resp = http.post().uri("/embeddings")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(new EmbReq(model, List.of(text))))
                .retrieve().bodyToMono(EmbResp.class).block();
        List<Double> v = resp.data().get(0).embedding();
        float[] out = new float[v.size()];
        for (int i=0;i<v.size();i++) out[i]=v.get(i).floatValue();
        return out;
    }

    @Override
    public int dim() { return dim; }
}