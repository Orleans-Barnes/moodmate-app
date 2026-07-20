package com.moodmate.auth.profile.controller;

import com.moodmate.auth.config.AvatarStorageProperties;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.profile.dto.WellnessPreferenceResponse;
import com.moodmate.auth.profile.service.WellnessPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Phase 1C-i.6. HTTP-layer coverage for the action endpoints (complete/skip/prompted) and the
 *  business-rule rejections (empty-goals completion, too-many-selections) - same
 *  service-mocked/no-DB approach as StudentProfileControllerTest. */
// addFilters = false: this project's SecurityConfig already permitAll()s everything (the
// gateway is what actually enforces JWT auth - see this service's SecurityConfig doc
// comment), but @WebMvcTest's security test slice can vary in whether it picks up a
// SecurityFilterChain bean automatically. Disabling filters here keeps these tests focused
// on routing/validation/exception-mapping, matching what actually happens in production
// (this service never authenticates a request itself).
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(WellnessPreferenceController.class)
class WellnessPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WellnessPreferenceService wellnessPreferenceService;

    // Not used by anything in this test class. Required only because @WebMvcTest also picks up
    // StaticResourceConfig (a global WebMvcConfigurer, unrelated to this controller), whose
    // constructor needs this bean. AvatarStorageProperties is a record (implicitly final), which
    // Mockito's default (non-inline) mock maker cannot mock - so @MockBean silently fails to
    // satisfy it. A real instance via @TestConfiguration sidesteps that entirely; there's no
    // behavior here to stub anyway.
    @TestConfiguration
    static class AvatarStoragePropertiesTestConfig {
        @Bean
        AvatarStorageProperties avatarStorageProperties() {
            return new AvatarStorageProperties("test-uploads", "http://localhost/test");
        }
    }

    @Test
    void completeReturns400WhenServiceRejectsEmptyGoals() throws Exception {
        when(wellnessPreferenceService.complete(1L))
                .thenThrow(new ApiException("Select at least one goal before completing", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/users/me/wellness-preferences/complete").header("X-User-Id", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Select at least one goal before completing"));
    }

    @Test
    void completeReturns200AndCompletedTrueOnSuccess() throws Exception {
        when(wellnessPreferenceService.complete(1L)).thenReturn(new WellnessPreferenceResponse(
                Set.of("LESS_STRESS"), Set.of(), Set.of(), true, false, Instant.now(), null, Instant.now()));

        mockMvc.perform(post("/api/users/me/wellness-preferences/complete").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void skipReturns200AndSkippedTrue() throws Exception {
        when(wellnessPreferenceService.skip(1L)).thenReturn(new WellnessPreferenceResponse(
                Set.of(), Set.of(), Set.of(), false, true, null, Instant.now(), Instant.now()));

        mockMvc.perform(post("/api/users/me/wellness-preferences/skip").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skipped").value(true));
    }

    @Test
    void promptedReturns204NoContent() throws Exception {
        mockMvc.perform(post("/api/users/me/wellness-preferences/prompted").header("X-User-Id", "1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void tooManyGoalsReturns400() throws Exception {
        when(wellnessPreferenceService.save(anyLong(), any()))
                .thenThrow(new ApiException("At most 5 goals may be selected", HttpStatus.BAD_REQUEST));

        mockMvc.perform(put("/api/users/me/wellness-preferences")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"goals\":[\"LESS_STRESS\",\"BETTER_SLEEP\",\"MORE_CONFIDENT\",\"BETTER_FOCUS\",\"BETTER_GRADES\",\"TRACK_EMOTIONS\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("At most 5 goals may be selected"));
    }
}
