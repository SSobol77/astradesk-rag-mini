// src/main/java/com/astradesk/rag/service/RagService.java
package com.astradesk.rag.service;

import com.astradesk.rag.model.ChunkRecord;
import com.astradesk.rag.repo.ChunkJdbcRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RagService {
    private final Embeddings embeddings;
    private final ChunkJdbcRepository chunks;
    private final ChatLLM chat;
    private final int topk;

    public RagService(Embeddings embeddings, ChunkJdbcRepository chunks, ChatLLM chat,
                      @Value("${rag.topk:5}") int topk) {
        this.embeddings = embeddings;
        this.chunks = chunks;
        this.chat = chat;
        this.topk = topk;
    }

    public List<ChunkRecord> search(String query, Integer k) {
        float[] v = embeddings.embed(query);
        return chunks.findSimilar(v, k != null ? k : topk);
    }

    public String chat(String question, Integer k) {
        var res = search(question, k);
        var ctx = res.stream().map(r -> r.content).toList();
        return chat.answer(question, ctx);
    }
}
