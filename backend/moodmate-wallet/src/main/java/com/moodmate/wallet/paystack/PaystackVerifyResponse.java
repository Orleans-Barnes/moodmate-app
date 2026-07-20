package com.moodmate.wallet.paystack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackVerifyResponse(boolean status, String message, PaystackTransactionData data) {
}
