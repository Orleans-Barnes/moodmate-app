package com.moodmate.support.entity;

/** Phase 1G - the Student -> Request -> Mentor accepts/declines workflow's state machine.
 * PENDING is the only re-actionable state; ACCEPTED/DECLINED are terminal for that request row
 * (a student can send a new request to the same mentor after a DECLINED one, per the partial
 * unique index in V4 - re-requesting doesn't reuse or mutate the old row). */
public enum MentorRequestStatus {
    PENDING, ACCEPTED, DECLINED
}
