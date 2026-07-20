package com.moodmate.auth.profile.controller;

import com.moodmate.auth.config.AvatarStorageProperties;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.profile.dto.StudentProfileResponse;
import com.moodmate.auth.profile.service.StudentProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 1C-i.6. HTTP-layer coverage - service is mocked (@MockBean), so this exercises routing,
 * @RequestHeader/@RequestBody binding, Bean Validation (@Size), and GlobalExceptionHandler's
 * status-code mapping, without needing a real database. Complements, not replaces, the
 * service-level unit tests in StudentProfileServiceTest.
 */
// addFilters = false: this project's SecurityConfig already permitAll()s everything (the
// gateway is what actually enforces JWT auth - see this service's SecurityConfig doc
// comment), but @WebMvcTest's security test slice can vary in whether it picks up a
// SecurityFilterChain bean automatically. Disabling filters here keeps these tests focused
// on routing/validation/exception-mapping, matching what actually happens in production
// (this service never authenticates a request itself).
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(StudentProfileController.class)
class StudentProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StudentProfileService studentProfileService;

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
    void getReturns404WhenNoProfileExistsYet() throws Exception {
        when(studentProfileService.get(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/me/student-profile").header("X-User-Id", "1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getReturns200WhenProfileExists() throws Exception {
        when(studentProfileService.get(1L)).thenReturn(
                Optional.of(new StudentProfileResponse("LAW", "FIRST_YEAR", Instant.now())));

        mockMvc.perform(get("/api/users/me/student-profile").header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programme").value("LAW"))
                .andExpect(jsonPath("$.yearOfStudy").value("FIRST_YEAR"));
    }

    @Test
    void putWithOnlyOneFieldSucceeds() throws Exception {
        when(studentProfileService.save(anyLong(), any()))
                .thenReturn(new StudentProfileResponse("LAW", null, Instant.now()));

        mockMvc.perform(put("/api/users/me/student-profile")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programme\":\"LAW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programme").value("LAW"));
    }

    @Test
    void putWithInvalidEnumReturns400ViaGlobalExceptionHandler() throws Exception {
        when(studentProfileService.save(anyLong(), any()))
                .thenThrow(new ApiException("Invalid programme: NOT_A_REAL_PROGRAMME", HttpStatus.BAD_REQUEST));

        mockMvc.perform(put("/api/users/me/student-profile")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programme\":\"NOT_A_REAL_PROGRAMME\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid programme: NOT_A_REAL_PROGRAMME"));
    }

    @Test
    void putWithFieldOverSizeLimitReturns400ViaBeanValidation() throws Exception {
        String tooLong = "A".repeat(50); // over the @Size(max = 40) bound

        mockMvc.perform(put("/api/users/me/student-profile")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"programme\":\"" + tooLong + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void putWithMalformedJsonReturns400NotFiveHundred() throws Exception {
        mockMvc.perform(put("/api/users/me/student-profile")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json"))
                .andExpect(status().isBadRequest());
    }
}
