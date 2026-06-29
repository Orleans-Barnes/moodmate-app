package com.moodmate.backend.payments.paystack;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PaystackInitializeResponse(boolean status, String message, Data data) {

    public record Data(
            @JsonProperty("authorization_url") String authorizationUrl,
            @JsonProperty("access_code") String accessCode,
            String reference) {
    }
}
