package com.moodmate.community.entity;

/** Mirrors the emoji set used by the frontend's community mock data (❤️ 🙏 💪 🎉). Ported from the
 * monolith's enum - the pre-existing stub stored reaction_type as a free String instead. */
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
