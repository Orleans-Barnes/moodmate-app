package com.moodmate.backend.payments.paystack;

import com.moodmate.backend.config.PaystackProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Thin wrapper around Paystack's REST API (https://api.paystack.co), used in test/sandbox mode
 * with a test secret key (sk_test_...) supplied via the PAYSTACK_SECRET_KEY env var - see
 * application.yml. Calls are made synchronously (.block()) since the rest of this app is a
 * conventional synchronous Spring MVC + JPA stack; WebClient is used here only because it's a
 * nicer client than RestTemplate, not because anything else here is reactive.
 */
@Component
@RequiredArgsConstructor
public class PaystackClient {

    private final PaystackProperties paystackProperties;
    private final WebClient.Builder webClientBuilder;

    /** Starts a one-off transaction and returns the hosted checkout page the client should open. */
    public PaystackInitializeResponse.Data initializeTransaction(String email, long amountPesewas, String reference,
                                                                   Map<String, Object> metadata) {
        PaystackInitializeRequest body = new PaystackInitializeRequest(
                email, amountPesewas, "GHS", reference, paystackProperties.callbackUrl(), metadata);

        PaystackInitializeResponse response = webClient().post()
                .uri("/transaction/initialize")
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::toError)
                .bodyToMono(PaystackInitializeResponse.class)
                .block();

        if (response == null || !response.status() || response.data() == null) {
            throw new PaystackException("Paystack did not return a usable initialize response for reference " + reference);
        }
        return response.data();
    }

    /** Asks Paystack directly whether a transaction reference actually succeeded. */
    public PaystackTransactionData verifyTransaction(String reference) {
        PaystackVerifyResponse response = webClient().get()
                .uri("/transaction/verify/{reference}", reference)
                .retrieve()
                .onStatus(HttpStatusCode::isError, this::toError)
                .bodyToMono(PaystackVerifyResponse.class)
                .block();

        if (response == null || response.data() == null) {
            throw new PaystackException("Paystack did not return a usable verify response for reference " + reference);
        }
        return response.data();
    }

    private WebClient webClient() {
        String secretKey = paystackProperties.secretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new PaystackException(
                    "PAYSTACK_SECRET_KEY is not configured - set it as an environment variable before using payments");
        }
        return webClientBuilder
                .baseUrl(paystackProperties.baseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                .build();
    }

    private Mono<? extends Throwable> toError(ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .map(responseBody -> new PaystackException(
                        "Paystack API error (" + response.statusCode() + "): " + responseBody));
    }
}
