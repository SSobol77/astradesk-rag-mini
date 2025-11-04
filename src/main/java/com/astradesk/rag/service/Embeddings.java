// src/main/java/com/astradesk/rag/service/Embeddings.java

package com.astradesk.rag.service;

/**
 * Minimalny interfejs wektoryzacji tekstu.
 * Implementacje: SpringAiEmbeddings, OpenAiHttpEmbeddings, Fake (w testach).
 */
public interface Embeddings {
    float[] embed(String text);
    int dim();
}