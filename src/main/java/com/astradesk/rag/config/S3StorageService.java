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
    public S3StorageService(S3Client s3, @Value("${s3.bucket}") String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    // Ensure bucket exists when performing the first write. Avoids network calls during
    // Spring context initialization so tests that don't configure S3 won't fail.
    private void ensureBucketIfNecessary() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        } catch (Exception e) {
            // Could be SdkClientException (connectivity) or other AWS errors. In that case,
            // do not fail application startup — let putObject surface errors if critical.
        }
    }

    public String put(String key, InputStream data, long size, String contentType) {
        ensureBucketIfNecessary();
        s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
            RequestBody.fromInputStream(data, size));
        return key;
    }
}
