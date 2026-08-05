package com.moodmate.admin.dto;
public record HealthPulseResponse(long totalUsers, long activeToday, long checkinsToday,
                                   long pendingCounsellors, long flaggedPosts,
                                   long sosActivations, double avgStressLevel) {}
