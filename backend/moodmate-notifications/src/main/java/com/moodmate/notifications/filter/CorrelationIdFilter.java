package com.moodmate.notifications.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/** Same role as every other service's CorrelationIdFilter (e.g. moodmate-gamification's) - see
 *  that class's doc comment for the full reasoning. Copied verbatim, package changed only. */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        org.slf4j.MDC.put(MDC_KEY, correlationId);
        response.setHeader(HEADER, correlationId);

        long startNanos = System.nanoTime();
        String method = request.getMethod();
        String uri = request.getRequestURI();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            log.info("{} {} completed {} in {} ms", method, uri, response.getStatus(), durationMs);
            org.slf4j.MDC.remove(MDC_KEY);
        }
    }
}
