package com.moodmate.community.entity;

/** New for Feature 7 (Community Moderation). PENDING sits in the moderation queue; DISMISSED
 * (approve = "content is fine") and CONTENT_REMOVED are terminal - both resolve every other
 * PENDING report for the same content item at once (see ModerationService), so duplicates never
 * linger in the queue after one admin action. */
public enum ReportStatus {
    PENDING, DISMISSED, CONTENT_REMOVED
}
