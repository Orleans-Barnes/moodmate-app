package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.ToggleGoalResponse;
import com.moodmate.wellness.dto.WellnessStateResponse;
import com.moodmate.wellness.engine.GoalEngine;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.service.WellnessService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Feature 17 (Integration Testing) - Part "Controllers". Same web-layer-slice approach as
 * JournalControllerTest, applied here specifically to prove two things JournalControllerTest
 * doesn't: a header-driven POST with no request body (toggleGoal/buyStreakShield/
 * buyDoubleXpBoost all take no @RequestBody at all), and ApiException's non-404 status codes
 * (PAYMENT_REQUIRED) flow through GlobalExceptionHandler correctly - JournalControllerTest only
 * exercised the NOT_FOUND case.
 */
@WebMvcTest(WellnessController.class)
class WellnessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WellnessService wellnessService;

    @Test
    void getStateReturnsTheCallersWellnessState() throws Exception {
        WellnessStateResponse state = new WellnessStateResponse(
                120, 700, GoalEngine.TreeStage.SPROUT, "🌱", 30, 4, null, List.of(), false, null);
        when(wellnessService.getState(9L)).thenReturn(state);

        mockMvc.perform(get("/api/wellness/state").header("X-User-Id", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.treeXp").value(120))
                .andExpect(jsonPath("$.treeStage").value("SPROUT"))
                .andExpect(jsonPath("$.leafBalance").value(30));
    }

    @Test
    void toggleGoalReturnsTheUpdatedStateAndStreakFlag() throws Exception {
        WellnessStateResponse state = new WellnessStateResponse(
                130, 700, GoalEngine.TreeStage.SPROUT, "🌱", 30, 5, null, List.of(), false, null);
        when(wellnessService.toggleGoal(9L, "hydrate")).thenReturn(new ToggleGoalResponse(state, true));

        mockMvc.perform(post("/api/wellness/goals/{key}/toggle", "hydrate").header("X-User-Id", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.streakIncrementedThisToggle").value(true))
                .andExpect(jsonPath("$.state.streakCount").value(5));
    }

    @Test
    void buyStreakShieldReturns402WhenTheUserCannotAffordIt() throws Exception {
        when(wellnessService.buyStreakShield(9L))
                .thenThrow(new ApiException("Not enough leaves to buy a streak shield: need 50", HttpStatus.PAYMENT_REQUIRED));

        mockMvc.perform(post("/api/wellness/streak/shield").header("X-User-Id", "9"))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Not enough leaves to buy a streak shield: need 50"));
    }

    @Test
    void buyDoubleXpBoostReturns402WhenTheUserCannotAffordIt() throws Exception {
        when(wellnessService.buyDoubleXpBoost(9L))
                .thenThrow(new ApiException("Not enough leaves to buy a Double XP boost: need 40", HttpStatus.PAYMENT_REQUIRED));

        mockMvc.perform(post("/api/wellness/boosts/double-xp").header("X-User-Id", "9"))
                .andExpect(status().isPaymentRequired());
    }

    @Test
    void buyDoubleXpBoostReturnsTheUpdatedStateOnSuccess() throws Exception {
        WellnessStateResponse state = new WellnessStateResponse(
                120, 700, GoalEngine.TreeStage.SPROUT, "🌱", 10, 4, null, List.of(), false,
                java.time.Instant.parse("2026-07-17T15:24:10Z"));
        when(wellnessService.buyDoubleXpBoost(9L)).thenReturn(state);

        mockMvc.perform(post("/api/wellness/boosts/double-xp").header("X-User-Id", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doubleXpActiveUntil").value("2026-07-17T15:24:10Z"));
    }
}
