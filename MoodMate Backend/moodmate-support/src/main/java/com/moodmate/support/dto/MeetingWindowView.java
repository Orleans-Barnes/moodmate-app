package com.moodmate.support.dto;

import java.time.Instant;

/** Phase 1F-B - response for GET .../appointments/{id}/meeting. `roomName`/`joinUrl` are only
 * ever populated when `open` is true - meet.jit.si has no server-side room authorization, so this
 * service withholding the real room name outside the authorized window/identity IS the access
 * control, not a UX nicety. When `open` is false, `reason` is one of NOT_CONFIRMED / TOO_EARLY /
 * EXPIRED, and `message` is a ready-to-display explanation. */
public record MeetingWindowView(boolean open, String roomName, String joinUrl, String reason, String message,
                                 Instant windowOpensAt, Instant windowClosesAt) {

    public static MeetingWindowView open(String roomName, String joinUrl, Instant opensAt, Instant closesAt) {
        return new MeetingWindowView(true, roomName, joinUrl, null, null, opensAt, closesAt);
    }

    public static MeetingWindowView closed(String reason, String message, Instant opensAt, Instant closesAt) {
        return new MeetingWindowView(false, null, null, reason, message, opensAt, closesAt);
    }
}
