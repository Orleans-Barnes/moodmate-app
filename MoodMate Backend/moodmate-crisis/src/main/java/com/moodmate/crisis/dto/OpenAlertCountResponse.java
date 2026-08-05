package com.moodmate.crisis.dto;

/** Mirrors the frontend's getOpenAlertCount() return shape: { open: number } (src/api/crisis.ts). */
public record OpenAlertCountResponse(long open) {}
