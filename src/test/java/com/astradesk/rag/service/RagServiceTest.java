package com.astradesk.rag.service;

import com.astradesk.rag.model.ChunkRecord;
import com.astradesk.rag.repo.ChunkJdbcRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RagServiceTest {

    @Mock
    private Embeddings embeddings;

    @Mock
    private ChunkJdbcRepository chunks;

    @Mock
    private ChatLLM chat;

    private RagService ragService;

    @BeforeEach
    void setUp() {
        ragService = new RagService(embeddings, chunks, chat, 5);
    }

    @Test
    void searchReturnsChunks() {
        float[] mockEmbedding = new float[]{0.1f, 0.2f, 0.3f};
        ChunkRecord mockChunk = new ChunkRecord(1L, 1L, 0, 1, 1, "test content", 0.95);
        
        when(embeddings.embed(anyString())).thenReturn(mockEmbedding);
        when(chunks.findSimilar(any(float[].class), anyInt())).thenReturn(List.of(mockChunk));

        List<ChunkRecord> results = ragService.search("test query", 3);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("test content", results.get(0).content);
        verify(embeddings).embed("test query");
        verify(chunks).findSimilar(mockEmbedding, 3);
    }

    @Test
    void searchUsesDefaultTopK() {
        float[] mockEmbedding = new float[]{0.1f, 0.2f};
        
        when(embeddings.embed(anyString())).thenReturn(mockEmbedding);
        when(chunks.findSimilar(any(float[].class), anyInt())).thenReturn(List.of());

        ragService.search("query", null);

        verify(chunks).findSimilar(mockEmbedding, 5);
    }

    @Test
    void chatGeneratesAnswer() {
        float[] mockEmbedding = new float[]{0.1f};
        ChunkRecord chunk = new ChunkRecord(1L, 1L, 0, 1, 1, "context", 0.9);
        
        when(embeddings.embed(anyString())).thenReturn(mockEmbedding);
        when(chunks.findSimilar(any(float[].class), anyInt())).thenReturn(List.of(chunk));
        when(chat.answer(anyString(), anyList())).thenReturn("answer");

        String result = ragService.chat("question", 3);

        assertEquals("answer", result);
        verify(chat).answer(eq("question"), eq(List.of("context")));
    }
}
