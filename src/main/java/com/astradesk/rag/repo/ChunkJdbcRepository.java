// src/main/java/com/astradesk/rag/repo/ChunkJdbcRepository.java
package com.astradesk.rag.repo;

import com.astradesk.rag.model.ChunkRecord;
import com.pgvector.PGvector;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ChunkJdbcRepository {
    private final JdbcTemplate jdbc;
    public ChunkJdbcRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public long insertChunk(long docId, int idx, Integer pFrom, Integer pTo, String sourceKey, String content, float[] emb) {
        String sql = "INSERT INTO chunks(doc_id, chunk_index, page_from, page_to, source_key, content, embedding) VALUES (?,?,?,?,?,?,?)";
        var keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, docId);
            ps.setInt(2, idx);
            if (pFrom != null) ps.setInt(3, pFrom); else ps.setNull(3, java.sql.Types.INTEGER);
            if (pTo != null) ps.setInt(4, pTo); else ps.setNull(4, java.sql.Types.INTEGER);
            ps.setString(5, sourceKey);
            ps.setString(6, content);
            ps.setObject(7, new PGvector(emb));
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        return key != null ? key.longValue() : -1L;
    }

    public List<ChunkRecord> findSimilar(float[] query, int k) {
        String sql = "SELECT id, doc_id, chunk_index, page_from, page_to, content, 1 - (embedding <=> ?) AS score " +
                "FROM chunks ORDER BY embedding <=> ? LIMIT ?";
        var q = new PGvector(query);
        RowMapper<ChunkRecord> rm = (rs, rn) -> new ChunkRecord(
                rs.getLong("id"), rs.getLong("doc_id"), rs.getInt("chunk_index"),
                (Integer) rs.getObject("page_from"), (Integer) rs.getObject("page_to"),
                rs.getString("content"), rs.getDouble("score"));
        return jdbc.query(sql, rm, q, q, k);
    }
}
