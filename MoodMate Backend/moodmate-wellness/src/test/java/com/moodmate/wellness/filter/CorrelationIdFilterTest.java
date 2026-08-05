package com.moodmate.wellness.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Feature 16 (Observability) - representative test for CorrelationIdFilter, the same class
 * (copy-per-service, like this project's other duplicated cross-service classes, e.g.
 * LeafTransactionReason) present identically in all 11 servlet-based services. Covers here once:
 * moodmate-gateway's CorrelationIdGlobalFilterTest covers the gateway's separate (reactive)
 * implementation.
 */
class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @Test
    void generatesACorrelationIdWhenTheHeaderIsMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/wellness/state");
        MockHttpServletResponse response = new MockHttpServletResponse();
        String[] seenInsideChain = new String[1];
        FilterChain chain = (req, res) -> seenInsideChain[0] = MDC.get(CorrelationIdFilter.MDC_KEY);

        filter.doFilter(request, response, chain);

        assertNotNull(seenInsideChain[0], "a correlation id must be generated and placed in MDC before the chain runs");
        assertFalse(seenInsideChain[0].isBlank());
        assertEquals(seenInsideChain[0], response.getHeader(CorrelationIdFilter.HEADER),
                "the response must echo back the same id that was put in MDC");
    }

    @Test
    void preservesAnIncomingCorrelationIdUnchanged() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/wellness/state");
        request.addHeader(CorrelationIdFilter.HEADER, "upstream-id-456");
        MockHttpServletResponse response = new MockHttpServletResponse();
        String[] seenInsideChain = new String[1];
        FilterChain chain = (req, res) -> seenInsideChain[0] = MDC.get(CorrelationIdFilter.MDC_KEY);

        filter.doFilter(request, response, chain);

        assertEquals("upstream-id-456", seenInsideChain[0]);
        assertEquals("upstream-id-456", response.getHeader(CorrelationIdFilter.HEADER));
    }

    @Test
    void alwaysClearsMdcAfterTheRequestEvenWhenTheChainCompletesNormally() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/wellness/state");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> { };

        filter.doFilter(request, response, chain);

        assertEquals(null, MDC.get(CorrelationIdFilter.MDC_KEY), "MDC must not leak past the request that set it");
    }

    @Test
    void clearsMdcEvenWhenTheChainThrows() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/wellness/state");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> { throw new RuntimeException("downstream failure"); };

        try {
            filter.doFilter(request, response, chain);
        } catch (Exception ignored) {
            // expected - the filter must not swallow the downstream exception
        }

        assertEquals(null, MDC.get(CorrelationIdFilter.MDC_KEY), "MDC must be cleared even when the chain throws");
    }

    @Test
    void aFreshCorrelationIdLooksLikeAUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/wellness/state");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> { };

        filter.doFilter(request, response, chain);

        String generated = response.getHeader(CorrelationIdFilter.HEADER);
        assertTrue(generated.matches("^[0-9a-f-]{36}$"), "generated id should be a standard UUID string: " + generated);
    }
}
