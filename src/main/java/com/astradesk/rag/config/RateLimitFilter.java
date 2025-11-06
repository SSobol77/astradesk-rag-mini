package com.astradesk.rag.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter implements WebFilter {
    
    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    
    @Value("${rag.rate-limit.enabled:false}")
    private boolean enabled;
    
    @Value("${rag.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;
    
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().value();
        if (path.startsWith("/actuator/") || path.equals("/health")) {
            return chain.filter(exchange);
        }

        String apiKey = exchange.getRequest().getHeaders().getFirst("X-API-Key");
        String key = apiKey != null ? apiKey : exchange.getRequest().getRemoteAddress().toString();

        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(requestsPerMinute));
        
        if (bucket.tryConsume()) {
            return chain.filter(exchange);
        } else {
            log.warn("Rate limit exceeded for key: {}", key);
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return exchange.getResponse().setComplete();
        }
    }

    private static class TokenBucket {
        private final int capacity;
        private final AtomicInteger tokens;
        private volatile long lastRefill;

        TokenBucket(int capacity) {
            this.capacity = capacity;
            this.tokens = new AtomicInteger(capacity);
            this.lastRefill = System.currentTimeMillis();
        }

        synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefill;
            if (elapsed > Duration.ofMinutes(1).toMillis()) {
                tokens.set(capacity);
                lastRefill = now;
            }
        }
    }
}
