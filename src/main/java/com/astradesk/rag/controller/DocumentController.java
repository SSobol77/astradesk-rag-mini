// src/main/java/com/astradesk/rag/controller/DocumentController.java
package com.astradesk.rag.controller;

import com.astradesk.rag.model.ChunkRecord;
import com.astradesk.rag.service.RagService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/docs", produces = MediaType.APPLICATION_JSON_VALUE)
public class DocumentController {
    private final RagService rag;
    public DocumentController(RagService rag) { this.rag = rag; }

    @GetMapping(path = "/search")
    public List<ChunkRecord> search(@RequestParam String q, @RequestParam(required=false) Integer k) {
        return rag.search(q, k);
    }
}
