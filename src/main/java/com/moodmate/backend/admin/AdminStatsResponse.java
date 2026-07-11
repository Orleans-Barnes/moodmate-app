package com.moodmate.backend.admin;

/**
 * Platform-wide statistics returned to the admin dashboard.
 */
public record AdminStatsResponse(
        long totalStudents,
        long totalCounsellors,
        long totalAppointments,
        long pendingCounsellorRequests,
        long totalCommunityPosts
) {}
