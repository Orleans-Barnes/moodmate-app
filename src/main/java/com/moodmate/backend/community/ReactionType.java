package com.moodmate.backend.community;

/** Mirrors the emoji set used by the frontend's community mock data (❤️ 🙏 💪 🎉). */
public enum ReactionType {
    HEART("❤️"),
    PRAYER("🙏"),
    MUSCLE("💪"),
    PARTY("🎉");

    private final String emoji;

    ReactionType(String emoji) {
        this.emoji = emoji;
    }

    public String emoji() {
        return emoji;
    }
}
