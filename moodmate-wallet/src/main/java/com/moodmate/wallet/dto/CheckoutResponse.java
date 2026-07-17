package com.moodmate.wallet.dto;

public record CheckoutResponse(String authorizationUrl, String reference) {
}
