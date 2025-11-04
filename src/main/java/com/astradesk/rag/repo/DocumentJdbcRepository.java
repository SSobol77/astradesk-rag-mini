// src/main/java/com/astradesk/rag/repo/DocumentJdbcRepository.java
package com.astradesk.rag.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DocumentJdbcRepository {
    private final JdbcTemplate jdbc;
    public DocumentJdbcRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public long insertDoc(String title, String language) {
        return jdbc.queryForObject("INSERT INTO docs(title, language) VALUES (?,?) RETURNING id",
                (rs, rn) -> rs.getLong(1), title, language);
    }
}
