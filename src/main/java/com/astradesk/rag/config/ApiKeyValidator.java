package com.astradesk.rag.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class ApiKeyValidator implements WebFilter {
    
    @Value("${rag.api-key:}")
    private String apiKey;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (apiKey == null || apiKey.isBlank()) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().value();
        
        if (path.startsWith("/actuator/") || path.equals("/health")) {
            return chain.filter(exchange);
        }

        String providedKey = exchange.getRequest().getHeaders().getFirst("X-API-Key");
        if (apiKey.equals(providedKey)) {
            return chain.filter(exchange);
        } else {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
