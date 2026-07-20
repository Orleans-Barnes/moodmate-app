package com.moodmate.support.dto;

/**
 * Phase 1F-A - backs GET /api/support/counsellor/analytics. All counts are lifetime (not windowed
 * to e.g. "this month") for this first pass - see SupportService.counsellorAnalytics()'s doc
 * comment for exactly how each bucket is defined, especially "missed" (which nothing in this
 * system transitions automatically - a CONFIRMED appointment whose time has passed and was never
 * marked COMPLETED by the counsellor).
 */
public record CounsellorAnalyticsResponse(
        long totalAppointments,
        long upcomingCount,
        long completedCount,
        long missedCount,
        long cancelledCount,
        double completionRate
) {
}
