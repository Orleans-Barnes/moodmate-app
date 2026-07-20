package com.moodmate.support.entity;

/** Phase 1F-A - a counsellor's real-time-ish self-reported availability (Online/Busy/Away), shown
 * on the student-facing directory. Deliberately a separate enum from CounsellorStatus (which is
 * the PENDING/APPROVED/REJECTED account-request workflow state, a completely different concept
 * that happens to also live on the Counsellor entity) - reusing that enum here would have
 * conflated "is this person allowed to be a counsellor at all" with "are they free right now." */
public enum CounsellorAvailabilityStatus {
    ONLINE, BUSY, AWAY
}
