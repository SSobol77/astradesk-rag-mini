// src/main/java/com/astradesk/rag/util/Chunker.java
package com.astradesk.rag.util;

import java.util.ArrayList;
import java.util.List;

public class Chunker {
    public static List<String> split(String text, int maxLen, int overlap) {
        List<String> out = new ArrayList<>();
        if (text == null || text.isBlank()) return out;
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + maxLen);
            String chunk = text.substring(start, end);
            out.add(chunk);
            if (end == text.length()) break;
            start = end - Math.min(overlap, end - start);
        }
        return out;
    }
}
