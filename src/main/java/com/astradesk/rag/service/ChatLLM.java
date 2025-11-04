// src/main/java/com/astradesk/rag/service/ChatLLM.java
package com.astradesk.rag.service;

import java.util.List;

/** Najprostszy interfejs czatu. */
public interface ChatLLM {
    String answer(String question, List<String> contexts);
}