package com.moodmate.crisis.client;

import com.moodmate.crisis.config.ServiceClientsProperties;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Feature 17 (Integration Testing) - Part "Internal Service Communication". Every other test
 * touching a *ServiceClient class in this project mocks the client itself (e.g.
 * WellnessServiceBoostTest mocks WalletServiceClient) - this is the first test in the project that
 * exercises a client's actual HTTP call over the wire, against a real (if minimal) server, proving
 * the request URI/method and response parsing genuinely work, not just that the calling code
 * reacts correctly to a pre-canned mock response.
 *
 * Uses JDK's built-in com.sun.net.httpserver.HttpServer rather than adding a mocking-server
 * dependency (WireMock, MockWebServer, etc.) - zero new dependencies, and this test only needs a
 * couple of fixed canned responses, not a full request-matching DSL.
 *
 * Scope note: AuthServiceClient is constructed directly here (new AuthServiceClient(properties)),
 * not through a Spring context. That means Feature 15's @Retry annotation is NOT exercised by this
 * test - resilience4j's retry/circuit-breaker behavior only activates through Spring's AOP proxy,
 * which requires a full application context. This test instead proves the thing @Retry can't:
 * that the request this client actually sends, and the response it actually parses, are correct.
 * The retry/fallback behavior itself was verified by Feature 15's manual review + the project
 * compiling clean with the new annotations - a dedicated @SpringBootTest-based retry test would be
 * a reasonable future addition, not done here to keep this test's setup (a plain HTTP server, no
 * Spring context needed) simple.
 */
class AuthServiceClientIntegrationTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void getPrimaryEmergencyContactParsesA200ResponseCorrectly() throws IOException {
        AtomicReference<String> capturedPath = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> {
            capturedPath.set(exchange.getRequestURI().getPath());
            String body = "{\"name\":\"Jane Doe\",\"phone\":\"+233555000111\",\"relationship\":\"Mother\"}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();

        AuthServiceClient client = new AuthServiceClient(
                new ServiceClientsProperties("http://localhost:" + server.getAddress().getPort()));

        EmergencyContactSummary result = client.getPrimaryEmergencyContact(42L);

        assertEquals("Jane Doe", result.name());
        assertEquals("+233555000111", result.phone());
        assertEquals("Mother", result.relationship());
        assertEquals("/internal/users/42/emergency-contacts/primary", capturedPath.get(),
                "the client must call the exact path auth-service exposes for this lookup");
    }

    @Test
    void getPrimaryEmergencyContactReturnsNullOnA204NoContentResponse() throws IOException {
        // auth-service returns 204 when the user genuinely has no primary contact on file - see
        // AuthServiceClient's own doc comment on why this and an unreachable-service failure both
        // resolve to null.
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> exchange.sendResponseHeaders(204, -1));
        server.start();

        AuthServiceClient client = new AuthServiceClient(
                new ServiceClientsProperties("http://localhost:" + server.getAddress().getPort()));

        assertNull(client.getPrimaryEmergencyContact(42L));
    }
}
