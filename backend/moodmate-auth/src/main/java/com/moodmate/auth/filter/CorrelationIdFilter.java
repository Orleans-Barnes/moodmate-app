package com.moodmate.auth.filter;

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

/**
 * Feature 16 (Observability) - Parts 1 and 2, Correlation IDs + structured request logging.
 *
 * X-Correlation-Id normally arrives already set by CorrelationIdGlobalFilter in moodmate-gateway
 * (every request routed through the gateway carries one). This filter also generates its own if
 * the header is missing, which covers the two cases where a request reaches this service without
 * having gone through that global filter: (a) a direct call to this service's port, bypassing the
 * gateway entirely (common in local dev/testing), and (b) internal service-to-service calls made
 * via this project's various *ServiceClient classes (e.g. WalletServiceClient), which today do not
 * forward the header - see OBSERVABILITY.md's "known follow-up" note on service-to-service
 * propagation.
 *
 * @Order(Ordered.HIGHEST_PRECEDENCE) so the MDC value is set (and the request start time
 * captured) before any other filter or the DispatcherServlet runs, and so the "completed ... in
 * N ms" line measures this service's full request-handling time, not just part of it.
 *
 * MDC is always cleared in the finally block - required so a value from one request can never
 * leak into a log line for a different request on the same pooled Tomcat worker thread.
 */
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
