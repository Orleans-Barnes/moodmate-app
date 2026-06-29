package com.moodmate.backend.payments.paystack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Shape of the "data" object Paystack returns from both GET /transaction/verify/:reference and
 * the charge.success webhook event - the two share the same transaction payload shape, so this
 * one record is parsed from both places (see PaystackClient.verifyTransaction and
 * PaystackWebhookEvent).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackTransactionData(
        Long id,
        String status,
        String reference,
        Long amount,
        String currency,
        @JsonProperty("paid_at") String paidAt,
        String channel,
        Customer customer,
        Authorization authorization) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Customer(@JsonProperty("customer_code") String customerCode) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Authorization(@JsonProperty("authorization_code") String authorizationCode) {
    }
}
