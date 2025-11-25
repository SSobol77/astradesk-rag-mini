// src/main/java/com/astradesk/rag/service/ZipIngestService.java
package com.astradesk.rag.service;

import com.astradesk.rag.config.S3StorageService;
import com.astradesk.rag.model.ProgressEvent;
import com.astradesk.rag.repo.ChunkJdbcRepository;
import com.astradesk.rag.repo.DocumentJdbcRepository;
import com.astradesk.rag.util.Chunker;
import com.github.pemistahl.lingua.api.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdfparser.PDFParser;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.Loader;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.*;

@Service
public class ZipIngestService {
    private static final Logger log = LoggerFactory.getLogger(ZipIngestService.class);
    
    private final DocumentJdbcRepository docs;
    private final ChunkJdbcRepository chunks;
    private final Embeddings embeddings;
    private final S3StorageService s3;

    private final LanguageDetector detector = LanguageDetectorBuilder.fromAllLanguages().build();

    public ZipIngestService(DocumentJdbcRepository docs, ChunkJdbcRepository chunks, Embeddings embeddings, S3StorageService s3) {
        this.docs = docs; this.chunks = chunks; this.embeddings = embeddings; this.s3 = s3;
    }

    public Flux<ProgressEvent> ingestZipAsStream(MultipartFile zip, String collection, int maxLen, int overlap) {
        return Mono.fromCallable(() -> loadZipEntries(zip))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(entries -> processEntries(entries, collection, maxLen, overlap, zip.getOriginalFilename()));
    }

    private List<ZipEntryData> loadZipEntries(MultipartFile zip) throws IOException {
        List<ZipEntryData> entries = new ArrayList<>();
        try (InputStream is = zip.getInputStream(); ZipInputStream zis = new ZipInputStream(is)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                zis.transferTo(baos);
                entries.add(new ZipEntryData(entry.getName(), baos.toByteArray()));
            }
        }
        return entries;
    }

    private Flux<ProgressEvent> processEntries(List<ZipEntryData> entries, String collection, int maxLen, int overlap, String zipName) {
        return Flux.<ProgressEvent>create((FluxSink<ProgressEvent> sink) -> {
            try {
                int total = entries.size();
                int processed = 0;
                for (ZipEntryData entry : entries) {
                    try {
                        processEntry(entry, collection, maxLen, overlap, processed, total, sink);
                        processed++;
                    } catch (Exception e) {
                        log.warn("Failed to process entry {}: {}", entry.name, e.getMessage());
                        sink.next(new ProgressEvent("ERROR", entry.name, null, processed++, total, "Failed to process", e.getMessage()));
                    }
                }
                sink.next(new ProgressEvent("DONE", zipName, null, null, null, "finished", null));
                sink.complete();
            } catch (Exception ex) {
                sink.next(new ProgressEvent("ERROR", zipName, null, null, null, "Ingestion failed", ex.getMessage()));
                sink.complete();
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private void processEntry(ZipEntryData entry, String collection, int maxLen, int overlap, int processed, int total, FluxSink<ProgressEvent> sink) throws IOException {
        String ext = extOf(entry.name);

        if (!isSupportedFormat(ext)) {
            sink.next(new ProgressEvent("SKIPPED", entry.name, null, processed, total, "unsupported extension", null));
            return;
        }

        sink.next(new ProgressEvent("RECEIVED", entry.name, null, processed, null, "processing", null));

        // Save original to S3
        String key = collection + "/raw/" + entry.name;
        s3.put(key, new ByteArrayInputStream(entry.data), entry.data.length, contentTypeFor(ext));

        // Detect language before inserting document
        String language = detectLanguage(ext, entry.data);

        // Insert document with detected language
        long docId = docs.insertDoc(entry.name, language);

        if (ext.equals("pdf")) {
            processPdf(docId, entry.data, key, maxLen, overlap);
        } else {
            processTextFile(docId, ext, entry.data, key, maxLen, overlap);
        }

        sink.next(new ProgressEvent("INDEXED", entry.name, null, processed, total, "ok", null));
    }

    private boolean isSupportedFormat(String ext) {
        return List.of("pdf", "md", "markdown", "html", "htm", "txt").contains(ext);
    }

    private String detectLanguage(String ext, byte[] data) {
        try {
            if (ext.equals("pdf")) {
                try (PDDocument document = Loader.loadPDF(data)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setStartPage(1);
                    stripper.setEndPage(1);
                    String firstPageText = stripper.getText(document);
                    return detect(firstPageText);
                }
            } else {
                String text = readTextByExt(ext, data);
                return detect(text);
            }
        } catch (Exception e) {
            log.warn("Failed to detect language: {}", e.getMessage());
            return null;
        }
    }

    private void processPdf(long docId, byte[] data, String key, int maxLen, int overlap) throws IOException {
        try (PDDocument document = Loader.loadPDF(data)) {
            int pages = document.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            for (int p = 1; p <= pages; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String pageText = stripper.getText(document);
                for (var part : Chunker.split(pageText, maxLen, overlap)) {
                    chunks.insertChunk(docId, p, p, p, key, part, embeddings.embed(part));
                }
            }
        }
    }

    private void processTextFile(long docId, String ext, byte[] data, String key, int maxLen, int overlap) throws IOException {
        int idx = 0;
        for (var part : Chunker.split(readTextByExt(ext, data), maxLen, overlap)) {
            chunks.insertChunk(docId, idx++, null, null, key, part, embeddings.embed(part));
        }
    }

    // Helper class for holding ZIP entry data
    private static class ZipEntryData {
        final String name;
        final byte[] data;

        ZipEntryData(String name, byte[] data) {
            this.name = name;
            this.data = data;
        }
    }

    private static String readTextByExt(String ext, byte[] data) throws IOException {
        return switch (ext) {
            case "md", "markdown", "txt" -> new String(data, StandardCharsets.UTF_8);
            case "html", "htm" -> Jsoup.parse(new String(data, StandardCharsets.UTF_8)).text();
            default -> "";
        };
    }

    private static String extOf(String name) {
        int i = name.lastIndexOf('.');
        return i>=0 ? name.substring(i+1).toLowerCase(Locale.ROOT) : "";
    }

    private static String contentTypeFor(String ext) {
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "md", "markdown" -> "text/markdown";
            case "html", "htm" -> "text/html";
            case "txt" -> "text/plain";
            default -> "application/octet-stream";
        };
    }

    private String detect(String text) {
        if (text == null || text.isBlank()) return null;
        Language lang = detector.detectLanguageOf(text);
        return lang != null ? lang.name() : null;
    }
}
