package com.moodmate.notifications.entity;

/** Business events, not a generic "INFO" bucket - deliberate per Phase 1E's design: keeps
 * scheduling/rendering logic in the frontend and future scheduling-rules job switchable on the
 * actual event, not a string it has to further interpret. Add new values here as new producers
 * come online (mentor/admin/wellness-hub, etc.) rather than reusing an unrelated existing one. */
public enum NotificationType {
    MOOD_REMINDER,
    JOURNAL_REMINDER,
    HABIT_REMINDER,
    SLEEP_REMINDER,

    APPOINTMENT_BOOKED,
    APPOINTMENT_CONFIRMED,
    APPOINTMENT_CANCELLED,
    APPOINTMENT_COMPLETED,
    // Phase 1E, Step 4 (Scheduling Rules) - distinct from APPOINTMENT_CONFIRMED above: that fires
    // once, the moment a counsellor confirms; this fires later, as a time-based "it's coming up"
    // nudge (see AppointmentReminderRule/AppointmentReminderScheduledJob).
    APPOINTMENT_REMINDER,

    MENTOR_REQUEST,
    MENTOR_ACCEPTED,
    MENTOR_DECLINED,

    // Counsellor/peer-mentor application + standing changes (admin approves/rejects a self-serve
    // request, or suspends/reinstates an already-approved one) - distinct from MENTOR_ACCEPTED/
    // MENTOR_DECLINED above, which are a *student's* request to connect with an already-approved
    // mentor, not the mentor's own application to the platform.
    COUNSELLOR_APPROVED,
    COUNSELLOR_REJECTED,
    COUNSELLOR_SUSPENDED,
    COUNSELLOR_REINSTATED,
    MENTOR_APPROVED,
    MENTOR_REJECTED,
    MENTOR_DEACTIVATED,
    MENTOR_REACTIVATED,

    CRISIS_ALERT,

    ARTICLE_PUBLISHED,
    EVENT_REMINDER,

    ACHIEVEMENT_UNLOCKED,
    MISSION_COMPLETED,

    ADMIN_ANNOUNCEMENT,

    SYSTEM
}
