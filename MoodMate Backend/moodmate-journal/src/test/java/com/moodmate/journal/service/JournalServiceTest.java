package com.moodmate.journal.service;

import com.moodmate.journal.client.CrisisServiceClient;
import com.moodmate.journal.client.PaymentsServiceClient;
import com.moodmate.journal.config.JournalUsageProperties;
import com.moodmate.journal.dto.JournalEntryRequest;
import com.moodmate.journal.dto.JournalEntryResponse;
import com.moodmate.journal.entity.JournalEntry;
import com.moodmate.journal.exception.ApiException;
import com.moodmate.journal.repository.JournalEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/** Covers Premium Enforcement's free-tier total-entry cap (Feature 3), plus Feature 12 (Journal
 * Improvements: Favorites, Tags, Search/filters) added below the original Feature 3 tests. */
class JournalServiceTest {

    private JournalEntryRepository repository;
    private CrisisServiceClient crisisServiceClient;
    private PaymentsServiceClient paymentsServiceClient;
    private JournalService service;

    @BeforeEach
    void setUp() {
        repository = mock(JournalEntryRepository.class);
        crisisServiceClient = mock(CrisisServiceClient.class);
        paymentsServiceClient = mock(PaymentsServiceClient.class);
        JournalUsageProperties usageProperties = new JournalUsageProperties(10);

        service = new JournalService(repository, crisisServiceClient, paymentsServiceClient, usageProperties);

        when(repository.save(any(JournalEntry.class))).thenAnswer(inv -> {
            JournalEntry e = inv.getArgument(0);
            e.setId(1L);
            e.setCreatedAt(Instant.now());
            e.setUpdatedAt(Instant.now());
            return e;
        });
    }

    @Test
    void freeUserAtEntryCapIsRejected() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(repository.countByUserId(1L)).thenReturn(10L);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.create(1L, new JournalEntryRequest("Title", "body text", null, null)));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, ex.getStatus());
        verify(repository, never()).save(any());
    }

    @Test
    void freeUserUnderEntryCapProceeds() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(repository.countByUserId(1L)).thenReturn(4L);

        var response = service.create(1L, new JournalEntryRequest("Title", "body text", null, null));

        assertEquals("body text", response.body());
        verify(repository, times(1)).save(any());
    }

    @Test
    void proUserBypassesEntryCapEntirely() {
        when(paymentsServiceClient.isPro(2L)).thenReturn(true);

        service.create(2L, new JournalEntryRequest("Title", "body text", null, null));

        verify(repository, never()).countByUserId(eq(2L));
        verify(repository, times(1)).save(any());
    }

    // --- Feature 12: Favorites, Tags, Search/filters ---

    @Test
    void createWithTagsPersistsThem() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);
        JournalEntryRequest request = new JournalEntryRequest("Title", "Body", "happy", Set.of("school", "stress"));

        JournalEntryResponse response = service.create(1L, request);

        assertEquals(Set.of("school", "stress"), response.tags());
        assertFalse(response.favorite(), "new entries default to not-favorite");
    }

    @Test
    void createWithoutTagsResultsInEmptySet() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);
        JournalEntryRequest request = new JournalEntryRequest("Title", "Body", null, null);

        JournalEntryResponse response = service.create(1L, request);

        assertTrue(response.tags().isEmpty());
    }

    @Test
    void updateWithNullTagsLeavesExistingTagsUntouched() {
        JournalEntry existing = JournalEntry.builder().id(1L).userId(1L).title("Old").body("Old body")
                .tags(new HashSet<>(Set.of("existing-tag"))).createdAt(Instant.now()).build();
        when(repository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        JournalEntryRequest request = new JournalEntryRequest("New", "New body", null, null);
        JournalEntryResponse response = service.update(1L, 1L, request);

        assertEquals(Set.of("existing-tag"), response.tags(),
                "a request with tags omitted must not wipe the entry's existing tags");
    }

    @Test
    void updateWithTagsReplacesExistingTags() {
        JournalEntry existing = JournalEntry.builder().id(1L).userId(1L).title("Old").body("Old body")
                .tags(new HashSet<>(Set.of("old-tag"))).createdAt(Instant.now()).build();
        when(repository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        JournalEntryRequest request = new JournalEntryRequest("New", "New body", null, Set.of("new-tag"));
        JournalEntryResponse response = service.update(1L, 1L, request);

        assertEquals(Set.of("new-tag"), response.tags());
    }

    @Test
    void setFavoriteUpdatesTheStoredEntry() {
        JournalEntry existing = JournalEntry.builder().id(1L).userId(1L).title("T").body("B")
                .favorite(false).tags(new HashSet<>()).createdAt(Instant.now()).build();
        when(repository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        JournalEntryResponse response = service.setFavorite(1L, 1L, true);

        assertTrue(response.favorite());
    }

    @Test
    void updateTagsReplacesTheFullSet() {
        JournalEntry existing = JournalEntry.builder().id(1L).userId(1L).title("T").body("B")
                .tags(new HashSet<>(Set.of("a", "b"))).createdAt(Instant.now()).build();
        when(repository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        JournalEntryResponse response = service.updateTags(1L, 1L, Set.of("c"));

        assertEquals(Set.of("c"), response.tags());
    }

    @Test
    void listTagsDelegatesToTheRepository() {
        when(repository.findDistinctTagsByUserId(1L)).thenReturn(List.of("school", "stress"));

        List<String> tags = service.listTags(1L);

        assertEquals(List.of("school", "stress"), tags);
    }

    @Test
    void searchWithAllFiltersNullDelegatesWithNullsPreserved() {
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.search(eq(1L), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(1L, null, null, null, null, null, null, pageable);

        verify(repository).search(eq(1L), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable));
    }

    @Test
    void searchTrimsWhitespaceAroundQ() {
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.search(eq(1L), eq("exam stress"), any(), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(1L, "  exam stress  ", null, null, null, null, null, pageable);

        verify(repository).search(eq(1L), eq("exam stress"), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable));
    }

    @Test
    void searchWithBlankQBecomesNullNotAnEmptyStringFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.search(eq(1L), isNull(), any(), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        service.search(1L, "   ", null, null, null, null, null, pageable);

        verify(repository).search(eq(1L), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable));
    }
}
