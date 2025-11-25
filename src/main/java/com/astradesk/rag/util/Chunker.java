// src/main/java/com/astradesk/rag/util/Chunker.java
package com.astradesk.rag.util;

import java.util.ArrayList;
import java.util.List;

public class Chunker {
    private static final String SENTENCE_DELIMITERS = "。!?！？\n";
    private static final String WORD_DELIMITERS = " \t\n\r";

    public static List<String> split(String text, int maxLen, int overlap) {
        List<String> out = new ArrayList<>();
        if (text == null || text.isBlank()) return out;

        int start = 0;
        while (start < text.length()) {
            int chunkEnd = Math.min(text.length(), start + maxLen);

            // If we've reached the end of text, use the chunk as-is
            if (chunkEnd >= text.length()) {
                String chunk = text.substring(start).trim();
                if (!chunk.isEmpty()) {
                    out.add(chunk);
                }
                break;
            }

            // Try to find a sentence boundary near maxLen
            int boundaryPos = findBoundary(text, start, chunkEnd);

            String chunk = text.substring(start, boundaryPos).trim();
            if (!chunk.isEmpty()) {
                out.add(chunk);
            }

            // Calculate next start position with overlap
            if (boundaryPos >= text.length()) break;
            
            // Move start forward, but keep overlap characters for context
            int stepSize = Math.max(1, boundaryPos - start - overlap);
            start = start + stepSize;
            
            // Skip leading whitespace at new start position
            while (start < text.length() && Character.isWhitespace(text.charAt(start))) {
                start++;
            }
        }
        return out;
    }

    /**
     * Find a good boundary position to split text.
     * Prefers sentence boundaries, then word boundaries.
     */
    private static int findBoundary(String text, int start, int maxEnd) {
        // If we can fit everything, return maxEnd
        if (maxEnd >= text.length()) {
            return text.length();
        }

        // First, try to find a sentence delimiter within a reasonable lookback window
        int searchWindowStart = Math.max(start, maxEnd - 100);
        for (int i = maxEnd; i >= searchWindowStart; i--) {
            if (i < text.length() && SENTENCE_DELIMITERS.indexOf(text.charAt(i)) >= 0) {
                // Found a sentence boundary, return position after delimiter
                int nextPos = i + 1;
                // Skip any whitespace after the delimiter
                while (nextPos < text.length() && Character.isWhitespace(text.charAt(nextPos))) {
                    nextPos++;
                }
                return nextPos;
            }
        }

        // If no sentence boundary found, try to find a word boundary (space)
        searchWindowStart = Math.max(start, maxEnd - 50);
        for (int i = maxEnd; i >= searchWindowStart; i--) {
            if (i < text.length() && WORD_DELIMITERS.indexOf(text.charAt(i)) >= 0) {
                // Skip any whitespace before this position
                int boundaryPos = i;
                while (boundaryPos > start && Character.isWhitespace(text.charAt(boundaryPos - 1))) {
                    boundaryPos--;
                }
                return boundaryPos;
            }
        }

        // Fallback: find the last non-alphanumeric character before maxEnd
        for (int i = maxEnd; i >= Math.max(start, maxEnd - 50); i--) {
            if (i < text.length() && !Character.isLetterOrDigit(text.charAt(i))) {
                return i;
            }
        }

        // If all else fails, just return maxEnd
        return maxEnd;
    }
}
