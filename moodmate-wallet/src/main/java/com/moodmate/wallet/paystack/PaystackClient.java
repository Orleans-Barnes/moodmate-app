package com.moodmate.wallet.paystack;

import com.moodmate.wallet.config.PaystackProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/**
 * Thin wrapper around Paystack's REST API (https://api.paystack.co). "Test mode" comes entirely
 * from which secret key is configured - a sk_test_... key (set via PAYSTACK_SECRET_KEY) puts
 * every call in Paystack's sandbox; a sk_live_... key would hit real money. There's no separate
 * test endpoint. Uses RestClient (Spring's synchronous HTTP client, available since Spring
 * Framework 6.1 with no extra dependency) rather than the monolith's WebClient+.block(), since
 * this service is a conventional blocking Spring MVC stack and doesn't need the reactive stack
 * pulled in just for this.
 */
@Component
@RequiredArgsConstructor
public class PaystackClient {

    private final PaystackProperties paystackProperties;

    public PaystackInitializeResponse.Data initializeTransaction(String email, long amountPesewas, String reference,
                                                                   Map<String, Object> metadata) {
        PaystackInitializeRequest body = new PaystackInitializeRequest(
                email, amountPesewas, "GHS", reference, paystackProperties.callbackUrl(), metadata);

        PaystackInitializeResponse response;
        try {
            response = restClient().post()
                    .uri("/transaction/initialize")
                    .body(body)
                    .retrieve()
                    .body(PaystackInitializeResponse.class);
        } catch (RestClientResponseException e) {
            throw new PaystackException("Paystack API error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
        }

        if (response == null || !response.status() || response.data() == null) {
            throw new PaystackException("Paystack did not return a usable initialize response for reference " + reference);
        }
        return response.data();
    }

    public PaystackTransactionData verifyTransaction(String reference) {
        PaystackVerifyResponse response;
        try {
            response = restClient().get()
                    .uri("/transaction/verify/{reference}", reference)
                    .retrieve()
                    .body(PaystackVerifyResponse.class);
        } catch (RestClientResponseException e) {
            throw new PaystackException("Paystack API error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
        }

        if (response == null || response.data() == null) {
            throw new PaystackException("Paystack did not return a usable verify response for reference " + reference);
        }
        return response.data();
    }

    // Feature 15 (Production Hardening) - Timeout Handling. External payment API - a longer read
    // timeout than internal service-to-service calls, but still bounded rather than infinite, so
    // a stalled Paystack response can't hang a checkout or webhook-verify request forever.
    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 10000;

    private RestClient restClient() {
        String secretKey = paystackProperties.secretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new PaystackException(
                    "PAYSTACK_SECRET_KEY is not configured - set it as an environment variable before using payments");
        }
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder()
                .baseUrl(paystackProperties.baseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                .requestFactory(factory)
                .build();
    }
}
