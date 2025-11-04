// src/main/java/com/astradesk/rag/config/S3StorageService.java
package com.astradesk.rag.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;

@Service
public class S3StorageService {
    private final S3Client s3; private final String bucket;
    public S3StorageService(S3Client s3, @Value("${s3.bucket}") String bucket) { this.s3 = s3; this.bucket = bucket; ensureBucket(); }

    private void ensureBucket() {
        try { s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build()); }
        catch (S3Exception e) { 
            if (e instanceof NoSuchBucketException) {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build()); 
            }
        }
    }

    public String put(String key, InputStream data, long size, String contentType) {
        s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                RequestBody.fromInputStream(data, size));
        return key;
    }
}
