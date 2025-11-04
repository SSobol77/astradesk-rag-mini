// src/main/java/com/astradesk/rag/controller/ZipController.java
package com.astradesk.rag.controller;

import com.astradesk.rag.model.ProgressEvent;
import com.astradesk.rag.service.ZipIngestService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping(path = "/ingest", produces = MediaType.APPLICATION_NDJSON_VALUE)
public class ZipController {
    private final ZipIngestService svc;
    public ZipController(ZipIngestService svc) { this.svc = svc; }

    /**
     * Przyjmuje ZIP i streamuje postęp jako SSE (Server‑sent Events).
     * Zwracamy zdarzenia postępu zgodne z Ndjson/SSE Flux.
     */
    @PostMapping(path = "/zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ProgressEvent>> upload(@RequestParam("file") MultipartFile file,
                                                       @RequestParam(value = "collection", required = false, defaultValue = "default") String collection,
                                                       @RequestParam(value = "maxLen", required = false, defaultValue = "1200") int maxLen,
                                                       @RequestParam(value = "overlap", required = false, defaultValue = "200") int overlap) {
        return svc.ingestZipAsStream(file, collection, maxLen, overlap)
                .map(ev -> ServerSentEvent.builder(ev).event("progress").build());
    }
}