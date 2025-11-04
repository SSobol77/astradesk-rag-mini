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
import reactor.core.publisher.Sinks;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

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
        Sinks.Many<ProgressEvent> sink = Sinks.many().unicast().onBackpressureBuffer();
        new Thread(() -> {
            int total = 0;
            try (InputStream is = zip.getInputStream(); ZipInputStream zis = new ZipInputStream(is)) {
                ZipEntry e;
                while ((e = zis.getNextEntry()) != null) {
                    if (!e.isDirectory()) total++;
                }
            } catch (Exception e) {
                log.warn("Failed to count ZIP entries: {}", e.getMessage());
            }
            try (InputStream is = zip.getInputStream(); ZipInputStream zis = new ZipInputStream(is)) {
                ZipEntry entry; int processed = 0;
                while ((entry = zis.getNextEntry()) != null) {
                    if (entry.isDirectory()) continue;
                    String name = entry.getName();
                    sink.tryEmitNext(new ProgressEvent("RECEIVED", name, null, processed, null, "processing"));
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    zis.transferTo(baos);
                    byte[] data = baos.toByteArray();

                    String ext = extOf(name);
                    if (!List.of("pdf","md","markdown","html","htm","txt").contains(ext)) {
                        sink.tryEmitNext(new ProgressEvent("SKIPPED", name, null, ++processed, null, "unsupported extension"));
                        continue;
                    }

                    // Сохраняем оригинал в S3
                    String key = collection + "/raw/" + name;
                    s3.put(key, new ByteArrayInputStream(data), data.length, contentTypeFor(ext));

                    String language = null; long docId = docs.insertDoc(name, language);
                    if (ext.equals("pdf")) {
                        try (PDDocument document = Loader.loadPDF(data)) {
                            int pages = document.getNumberOfPages();
                            PDFTextStripper stripper = new PDFTextStripper();
                            for (int p=1; p<=pages; p++) {
                                stripper.setStartPage(p); stripper.setEndPage(p);
                                String pageText = stripper.getText(document);
                                if (language == null || language.isBlank()) language = detect(pageText);
                                for (var part : Chunker.split(pageText, maxLen, overlap)) {
                                    float[] v = embeddings.embed(part);
                                    chunks.insertChunk(docId, p, p, p, key, part, v);
                                }
                                sink.tryEmitNext(new ProgressEvent("INDEXED", name, p, p, pages, "ok"));
                            }
                        }
                    } else {
                        String text = readTextByExt(ext, data);
                        language = detect(text);
                        int idx=0;
                        for (var part : Chunker.split(text, maxLen, overlap)) {
                            float[] v = embeddings.embed(part);
                            chunks.insertChunk(docId, idx++, null, null, key, part, v);
                        }
                        sink.tryEmitNext(new ProgressEvent("INDEXED", name, null, ++processed, null, "ok"));
                    }
                }
                sink.tryEmitNext(new ProgressEvent("DONE", zip.getOriginalFilename(), null, null, null, "finished"));
                sink.tryEmitComplete();
            } catch (Exception ex) {
                sink.tryEmitNext(new ProgressEvent("ERROR", zip.getOriginalFilename(), null, null, null, ex.getMessage()));
                sink.tryEmitComplete();
            }
        }).start();
        return sink.asFlux();
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
