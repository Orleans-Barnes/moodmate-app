package com.moodmate.admin.dto;

public record AdminStatsResponse(long totalStudents, long totalCounsellors, long totalAppointments,
                                  long pendingCounsellorRequests, long totalCommunityPosts) {
}
