package com.moodmate.journal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodmate.journal.exception.ApiException;
import com.moodmate.journal.dto.JournalEntryRequest;
import com.moodmate.journal.dto.JournalEntryResponse;
import com.moodmate.journal.service.JournalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Feature 17 (Integration Testing) - Part "Controllers". Web-layer slice test: real Spring MVC
 * request mapping/JSON (de)serialization/validation/exception-mapping through
 * GlobalExceptionHandler, with JournalService mocked out (that class's own business logic is
 * already covered by JournalServiceTest's unit tests - this test's job is only to prove the HTTP
 * contract - status codes, header handling, request/response shapes - is wired correctly).
 *
 * @MockitoBean rather than the older @MockBean, which is deprecated as of Spring Framework 6.2 /
 * Boot 3.4 (this project is on Boot 3.5.11).
 */
@WebMvcTest(JournalController.class)
class JournalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private JournalService journalService;

    @Test
    void createReturns201AndTheCreatedEntryWhenTheRequestIsValid() throws Exception {
        JournalEntryRequest request = new JournalEntryRequest("My day", "It was a good day.", "😀", Set.of("gratitude"));
        JournalEntryResponse response = new JournalEntryResponse(
                1L, "My day", "It was a good day.", "😀", false, Set.of("gratitude"), Instant.now(), Instant.now());
        when(journalService.create(eq(7L), any(JournalEntryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/journal")
                        .header("X-User-Id", "7")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("My day"))
                .andExpect(jsonPath("$.tags[0]").value("gratitude"));
    }

    @Test
    void createReturns400WhenTheRequiredBodyFieldIsBlank() throws Exception {
        // body is @NotBlank on JournalEntryRequest - an empty body must fail validation before
        // JournalService is ever called.
        JournalEntryRequest invalidRequest = new JournalEntryRequest("Title only", "", null, null);

        mockMvc.perform(post("/api/journal")
                        .header("X-User-Id", "7")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aMissingXUserIdHeaderIsRejectedRatherThanReachingTheService() throws Exception {
        // This route is only ever called with X-User-Id already set by the gateway's
        // JwtAuthFilter in real traffic, so this is a defensive/contract check rather than a
        // real-world path. Documenting the actual observed behavior here rather than an assumed
        // one: GlobalExceptionHandler only declares handlers for ApiException,
        // MethodArgumentNotValidException, DataIntegrityViolationException, and a catch-all
        // Exception.class - it has no specific handler for Spring's
        // MissingRequestHeaderException, so that catch-all is what actually resolves this case,
        // producing 500 rather than a more descriptive 400. Real callers can't hit this (the
        // gateway guarantees the header), so this is flagged as a known, low-priority gap rather
        // than something fixed as part of this testing pass - see OBSERVABILITY.md-style
        // "known follow-ups" convention used elsewhere in this project.
        JournalEntryRequest request = new JournalEntryRequest("Title", "Body text", null, null);

        mockMvc.perform(post("/api/journal")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getReturns404ViaApiExceptionWhenTheEntryDoesNotBelongToTheCaller() throws Exception {
        when(journalService.get(7L, 999L)).thenThrow(new ApiException("Entry not found", HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/journal/{id}", 999L).header("X-User-Id", "7"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Entry not found"));
    }

    @Test
    void listReturnsAPageOfEntriesForTheCallingUser() throws Exception {
        JournalEntryResponse entry = new JournalEntryResponse(
                2L, "Entry", "Body", null, false, Set.of(), Instant.now(), Instant.now());
        when(journalService.list(eq(7L), any())).thenReturn(new PageImpl<>(List.of(entry), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/journal").header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(2))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void deleteReturns204AndDelegatesToTheService() throws Exception {
        mockMvc.perform(delete("/api/journal/{id}", 5L).header("X-User-Id", "7"))
                .andExpect(status().isNoContent());

        verify(journalService).delete(7L, 5L);
    }

    @Test
    void countReturnsThePlainLongBodyFromTheService() throws Exception {
        when(journalService.count(7L)).thenReturn(3L);

        mockMvc.perform(get("/api/journal/count").header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }
}
