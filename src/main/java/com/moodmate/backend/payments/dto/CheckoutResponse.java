package com.moodmate.backend.payments.dto;

public record CheckoutResponse(String authorizationUrl, String reference) {
}
