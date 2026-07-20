package com.moodmate.auth.profile.enums;

/** Phase 1C-i. "How would you like MoodMate to support you?" — named PreferredSupport rather
 *  than the earlier-proposed SupportType per the reviewed decision (clearer intent: this is a
 *  preference the student expresses, not a category the system assigns). Storage column stays
 *  named support_type (see V11 migration) — only the Java-level name changed. */
public enum PreferredSupport {
    AI_COACH,
    COUNSELLOR,
    PEER_MENTOR,
    JOURNALING,
    BREATHING,
    COMMUNITY,
    SELF_GUIDED
}
