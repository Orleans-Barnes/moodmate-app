package com.moodmate.wallet.paystack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackWebhookEvent(String event, PaystackTransactionData data) {
}
