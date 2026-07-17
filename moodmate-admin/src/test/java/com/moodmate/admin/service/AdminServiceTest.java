package com.moodmate.admin.service;

import com.moodmate.admin.dto.WhitelistEntryDto;
import com.moodmate.admin.entity.WhitelistEntry;
import com.moodmate.admin.repository.WhitelistEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Feature 17 (Integration Testing) - Part "Services". moodmate-admin had zero tests before this.
 * Scoped to AdminService's whitelist methods only (the one thing this service owns outright and
 * writes to - see AdminService's class-level doc comment) - stats()/healthPulse() are read-only
 * hand-written cross-schema COUNT queries via JdbcTemplate with no branching logic to verify;
 * mocking JdbcTemplate.queryForObject(...) for each of their ~10 combined SQL strings would add a
 * lot of brittle test code (breaks on every harmless SQL rewording) for very little actual risk
 * coverage. Flagging this scoping choice rather than silently skipping those methods.
 */
class AdminServiceTest {

    private JdbcTemplate jdbcTemplate;
    private WhitelistEntryRepository whitelistRepository;
    private AdminService service;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        whitelistRepository = mock(WhitelistEntryRepository.class);
        service = new AdminService(jdbcTemplate, whitelistRepository);
    }

    @Test
    void addToWhitelistNormalizesEmailCaseAndWhitespace() {
        when(whitelistRepository.findByEmail("counsellor@example.com")).thenReturn(Optional.empty());
        when(whitelistRepository.save(any())).thenAnswer(inv -> {
            WhitelistEntry e = inv.getArgument(0);
            e.setId(1L);
            e.setAddedAt(Instant.now());
            return e;
        });

        WhitelistEntryDto result = service.addToWhitelist("  Counsellor@Example.COM  ", "pre-vetted");

        assertEquals("counsellor@example.com", result.email());
        verify(whitelistRepository).findByEmail("counsellor@example.com");
    }

    @Test
    void addToWhitelistRejectsADuplicateEmailWithConflict() {
        when(whitelistRepository.findByEmail("dup@example.com"))
                .thenReturn(Optional.of(WhitelistEntry.builder().id(1L).email("dup@example.com").build()));

        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.addToWhitelist("dup@example.com", null));

        assertEquals(409, e.getStatusCode().value());
        verify(whitelistRepository, never()).save(any());
    }

    @Test
    void removeFromWhitelistThrowsNotFoundForAnUnknownEmail() {
        when(whitelistRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.removeFromWhitelist("nobody@example.com"));

        assertEquals(404, e.getStatusCode().value());
        verify(whitelistRepository, never()).deleteByEmail(any());
    }

    @Test
    void removeFromWhitelistDeletesByNormalizedEmailWhenFound() {
        when(whitelistRepository.findByEmail("counsellor@example.com"))
                .thenReturn(Optional.of(WhitelistEntry.builder().id(1L).email("counsellor@example.com").build()));

        service.removeFromWhitelist("  Counsellor@Example.com ");

        verify(whitelistRepository).deleteByEmail("counsellor@example.com");
    }

    @Test
    void listWhitelistMapsEntitiesToDtosInRepositoryOrder() {
        WhitelistEntry a = WhitelistEntry.builder().id(1L).email("a@example.com").notes("first").addedAt(Instant.now()).build();
        WhitelistEntry b = WhitelistEntry.builder().id(2L).email("b@example.com").notes(null).addedAt(Instant.now()).build();
        when(whitelistRepository.findAllByOrderByAddedAtDesc()).thenReturn(List.of(a, b));

        List<WhitelistEntryDto> result = service.listWhitelist();

        assertEquals(2, result.size());
        assertEquals("a@example.com", result.get(0).email());
        assertEquals("b@example.com", result.get(1).email());
    }
}
