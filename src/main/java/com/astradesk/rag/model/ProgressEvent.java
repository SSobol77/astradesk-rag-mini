// src/main/java/com/astradesk/rag/model/ProgressEvent.java
package com.astradesk.rag.model;

public record ProgressEvent(String stage, String file, Integer page, Integer processed, Integer total, String message) {}