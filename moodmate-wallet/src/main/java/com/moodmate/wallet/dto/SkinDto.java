package com.moodmate.wallet.dto;

public record SkinDto(Long id, String code, String emoji, String name, int cost, boolean owned, boolean equipped,
                       boolean proOnly) {
}
