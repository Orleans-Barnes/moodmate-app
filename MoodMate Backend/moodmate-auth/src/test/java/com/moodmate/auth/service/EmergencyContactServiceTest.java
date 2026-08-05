package com.moodmate.auth.service;

import com.moodmate.auth.dto.CreateEmergencyContactRequest;
import com.moodmate.auth.dto.EmergencyContactResponse;
import com.moodmate.auth.dto.EmergencyContactSummary;
import com.moodmate.auth.dto.UpdateEmergencyContactRequest;
import com.moodmate.auth.entity.EmergencyContact;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.repository.EmergencyContactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Covers Feature 10's primary-contact invariant (first contact auto-primary, unset-then-set on
 * swap, auto-promotion on deleting the primary, explicit un-primary via update() leaves none) and
 * the cross-service summary read. */
class EmergencyContactServiceTest {

    private EmergencyContactRepository repository;
    private EmergencyContactService service;

    @BeforeEach
    void setUp() {
        repository = mock(EmergencyContactRepository.class);
        service = new EmergencyContactService(repository);
        when(repository.save(any(EmergencyContact.class))).thenAnswer(inv -> {
            EmergencyContact c = inv.getArgument(0);
            if (c.getId() == null) c.setId(1L);
            c.setCreatedAt(Instant.now());
            c.setUpdatedAt(Instant.now());
            return c;
        });
    }

    @Test
    void firstContactBecomesPrimaryEvenIfNotRequested() {
        when(repository.countByUserId(9L)).thenReturn(0L);
        when(repository.findByUserIdAndPrimaryTrue(9L)).thenReturn(Optional.empty());

        EmergencyContactResponse response = service.create(9L,
                new CreateEmergencyContactRequest("Mom", "555-1234", "Mother", null, false));

        assertTrue(response.isPrimary());
    }

    @Test
    void secondContactRespectsRequestedPrimaryFlagAndUnsetsThePreviousOne() {
        when(repository.countByUserId(9L)).thenReturn(1L);
        EmergencyContact existingPrimary = EmergencyContact.builder().id(1L).userId(9L).name("Mom")
                .phone("555-1234").primary(true).build();
        when(repository.findByUserIdAndPrimaryTrue(9L)).thenReturn(Optional.of(existingPrimary));

        EmergencyContactResponse response = service.create(9L,
                new CreateEmergencyContactRequest("Dad", "555-5678", "Father", null, true));

        assertTrue(response.isPrimary());
        assertFalse(existingPrimary.isPrimary(), "the previous primary must be unset");
    }

    @Test
    void secondContactStaysNonPrimaryWhenNotRequested() {
        when(repository.countByUserId(9L)).thenReturn(1L);

        EmergencyContactResponse response = service.create(9L,
                new CreateEmergencyContactRequest("Friend", "555-9999", "Friend", "backup contact", false));

        assertFalse(response.isPrimary());
    }

    @Test
    void updateCanExplicitlyUnsetPrimaryLeavingNoneSet() {
        EmergencyContact contact = EmergencyContact.builder().id(1L).userId(9L).name("Mom")
                .phone("555-1234").primary(true).build();
        when(repository.findByIdAndUserId(1L, 9L)).thenReturn(Optional.of(contact));

        EmergencyContactResponse response = service.update(9L, 1L,
                new UpdateEmergencyContactRequest("Mom", "555-1234", "Mother", null, false));

        assertFalse(response.isPrimary());
    }

    @Test
    void deletingThePrimaryContactPromotesTheNextRemainingOne() {
        EmergencyContact toDelete = EmergencyContact.builder().id(1L).userId(9L).name("Mom")
                .phone("555-1234").primary(true).build();
        EmergencyContact remaining = EmergencyContact.builder().id(2L).userId(9L).name("Dad")
                .phone("555-5678").primary(false).build();
        when(repository.findByIdAndUserId(1L, 9L)).thenReturn(Optional.of(toDelete));
        when(repository.findByUserIdOrderByPrimaryDescCreatedAtAsc(9L)).thenReturn(List.of(remaining));

        service.delete(9L, 1L);

        assertTrue(remaining.isPrimary(), "the next remaining contact must be auto-promoted to primary");
    }

    @Test
    void deletingANonPrimaryContactDoesNotTouchAnyoneElse() {
        EmergencyContact toDelete = EmergencyContact.builder().id(2L).userId(9L).name("Friend")
                .phone("555-9999").primary(false).build();
        when(repository.findByIdAndUserId(2L, 9L)).thenReturn(Optional.of(toDelete));

        service.delete(9L, 2L);

        // findByUserIdOrderByPrimaryDescCreatedAtAsc must never be called for a non-primary delete
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never())
                .findByUserIdOrderByPrimaryDescCreatedAtAsc(any());
    }

    @Test
    void deleteRejectsAContactBelongingToAnotherUser() {
        when(repository.findByIdAndUserId(1L, 99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.delete(99L, 1L));
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void getPrimarySummaryReturnsNullWhenNoneSet() {
        when(repository.findByUserIdAndPrimaryTrue(9L)).thenReturn(Optional.empty());

        EmergencyContactSummary summary = service.getPrimarySummary(9L);

        assertNull(summary);
    }

    @Test
    void getPrimarySummaryReturnsTheContactWhenSet() {
        EmergencyContact contact = EmergencyContact.builder().id(1L).userId(9L).name("Mom")
                .phone("555-1234").relationship("Mother").primary(true).build();
        when(repository.findByUserIdAndPrimaryTrue(9L)).thenReturn(Optional.of(contact));

        EmergencyContactSummary summary = service.getPrimarySummary(9L);

        assertEquals("Mom", summary.name());
        assertEquals("555-1234", summary.phone());
        assertEquals("Mother", summary.relationship());
    }
}
