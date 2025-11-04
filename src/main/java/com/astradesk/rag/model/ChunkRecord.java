package com.astradesk.rag.model;

/**
 * Represents a text chunk with its embedding and metadata.
 */
public class ChunkRecord {
    public final long id;
    public final long docId;
    public final int chunkIndex;
    public final Integer pageFrom;
    public final Integer pageTo;
    public final String content;
    public final double score;

    public ChunkRecord(long id, long docId, int chunkIndex,
                       Integer pageFrom, Integer pageTo,
                       String content, double score) {
        this.id = id;
        this.docId = docId;
        this.chunkIndex = chunkIndex;
        this.pageFrom = pageFrom;
        this.pageTo = pageTo;
        this.content = content;
        this.score = score;
    }

    @Override
    public String toString() {
        return "ChunkRecord{" +
                "id=" + id +
                ", docId=" + docId +
                ", chunkIndex=" + chunkIndex +
                ", pageFrom=" + pageFrom +
                ", pageTo=" + pageTo +
                ", score=" + score +
                ", content='" + (content != null && content.length() > 50 ? 
                    content.substring(0, 50) + "..." : content) + '\'' +
                '}';
    }
}
