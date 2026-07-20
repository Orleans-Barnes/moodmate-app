package com.moodmate.crisis.dto;

import jakarta.validation.constraints.NotNull;

/** Backs POST /api/crisis/alerts/{id} - action is required, notes is optional (mirrors the
 * frontend's updateAlert(token, alertId, action, notes?) call in src/api/crisis.ts). */
public record UpdateCrisisAlertRequest(@NotNull CrisisAction action, String notes) {
    public enum CrisisAction { ACKNOWLEDGE, RESOLVE }
}
