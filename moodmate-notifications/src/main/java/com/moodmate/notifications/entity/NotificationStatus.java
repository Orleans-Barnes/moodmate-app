package com.moodmate.notifications.entity;

/** PENDING: created, not yet due (no scheduledAt, or scheduledAt is in the future) and not yet
 * delivered by any channel. SCHEDULED: has a future scheduledAt, explicitly distinct from PENDING
 * so "waiting to be sent at a specific time" and "should have gone out already but hasn't" are
 * distinguishable in a query, not left to a null-check on scheduledAt alone. DELIVERED: shown to
 * the user via at least one channel (in-app inbox counts as delivery; push is a separate concern
 * layered on top later - see Step 5). READ: the user has explicitly opened/acknowledged it -
 * always implies DELIVERED first, never set independently. FAILED: a delivery attempt errored
 * (e.g. a future push-send failure); does not apply to the in-app inbox itself, which can't "fail"
 * to have a row exist. */
public enum NotificationStatus {
    PENDING,
    SCHEDULED,
    DELIVERED,
    READ,
    FAILED
}
