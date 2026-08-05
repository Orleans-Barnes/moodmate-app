package com.moodmate.wallet.paystack;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public record PaystackInitializeRequest(
        String email,
        long amount,
        String currency,
        String reference,
        @JsonProperty("callback_url") String callbackUrl,
        Map<String, Object> metadata) {
}
