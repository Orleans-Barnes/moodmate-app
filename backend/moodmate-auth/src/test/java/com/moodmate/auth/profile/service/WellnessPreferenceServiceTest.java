package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.WellnessPreferenceRequest;
import com.moodmate.auth.profile.dto.WellnessPreferenceResponse;
import com.moodmate.auth.profile.entity.WellnessPreference;
import com.moodmate.auth.profile.enums.Challenge;
import com.moodmate.auth.profile.enums.WellnessGoal;
import com.moodmate.auth.profile.repository.WellnessPreferenceRepository;
import com.moodmate.auth.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Covers the completedAt/skippedAt contract that fixes the "existsByUserId() looks complete but
 *  isn't" bug caught during Phase 1C-i review - see WellnessPreferenceService's doc comment. */
class WellnessPreferenceServiceTest {

    private WellnessPreferenceRepository repo;
    private WellnessPreferenceService service;

    @BeforeEach
    void setUp() {
        repo = mock(WellnessPreferenceRepository.class);
        service = new WellnessPreferenceService(repo);
        when(repo.save(any(WellnessPreference.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void savingAFieldAloneDoesNotMarkOnboardingComplete() {
        when(repo.findByUserId(1L)).thenReturn(Optional.empty());

        WellnessPreferenceResponse result = service.save(1L,
                new WellnessPreferenceRequest(Set.of("LESS_STRESS"), null, null));

        assertFalse(result.completed(), "a plain field save must never imply the flow finished");
        assertTrue(result.goals().contains("LESS_STRESS"));
    }

    @Test
    void completeIsTheOnlyThingThatSetsCompleted() {
        WellnessPreference existing = WellnessPreference.builder()
                .userId(2L).goals(Set.of(WellnessGoal.LESS_STRESS)).build();
        when(repo.findByUserId(2L)).thenReturn(Optional.of(existing));

        WellnessPreferenceResponse result = service.complete(2L);

        assertTrue(result.completed());
    }

    // Phase 1C-i.6: "completing" a flow with nothing selected isn't a meaningful completion -
    // the user should call skip() instead if they don't want to engage with goals at all.
    @Test
    void completingWithNoGoalsSelectedIsRejected() {
        when(repo.findByUserId(7L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.complete(7L));
        assertTrue(ex.getMessage().toLowerCase().contains("goal"));
    }

    // Phase 1C-i.6: business-rule selection caps, distinct from the DTO's defensive @Size(max=20).
    @Test
    void tooManyGoalsIsRejected() {
        when(repo.findByUserId(8L)).thenReturn(Optional.empty());

        Set<String> sixGoals = Set.of("LESS_STRESS", "BETTER_SLEEP", "MORE_CONFIDENT",
                "BETTER_FOCUS", "BETTER_GRADES", "TRACK_EMOTIONS");
        assertEquals(6, sixGoals.size());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.save(8L, new WellnessPreferenceRequest(sixGoals, null, null)));
        assertTrue(ex.getMessage().contains("goals"));
    }

    @Test
    void skipStampsBothSkippedAndLastPrompted() {
        when(repo.findByUserId(3L)).thenReturn(Optional.empty());

        service.skip(3L);

        verify(repo).save(argThat(p -> p.getSkippedAt() != null && p.getLastPromptedAt() != null));
    }

    @Test
    void partialSaveMergesNotReplaces() {
        WellnessPreference existing = WellnessPreference.builder()
                .userId(4L)
                .goals(Set.of(WellnessGoal.BETTER_SLEEP))
                .challenges(Set.of(Challenge.BURNOUT))
                .build();
        when(repo.findByUserId(4L)).thenReturn(Optional.of(existing));

        // Only goals sent - challenges must survive untouched.
        WellnessPreferenceResponse result = service.save(4L,
                new WellnessPreferenceRequest(Set.of("MORE_CONFIDENT"), null, null));

        assertEquals(Set.of("MORE_CONFIDENT"), result.goals());
        assertEquals(Set.of("BURNOUT"), result.challenges(), "challenges must survive a goals-only save");
    }

    // Phase 1C-i.5 hardening: explicit null-merge coverage on the preferredSupport field too
    // (partialSaveMergesNotReplaces above already covers goals/challenges) - a challenges-only
    // save must never erase an already-saved preferredSupport.
    @Test
    void challengesOnlySaveDoesNotErasePreferredSupport() {
        WellnessPreference existing = WellnessPreference.builder()
                .userId(6L)
                .preferredSupport(Set.of(com.moodmate.auth.profile.enums.PreferredSupport.JOURNALING))
                .build();
        when(repo.findByUserId(6L)).thenReturn(Optional.of(existing));

        WellnessPreferenceResponse result = service.save(6L,
                new WellnessPreferenceRequest(null, Set.of("BURNOUT"), null));

        assertEquals(Set.of("BURNOUT"), result.challenges());
        assertEquals(Set.of("JOURNALING"), result.preferredSupport(),
                "preferredSupport must survive a challenges-only save");
    }

    // Phase 1C-i.5 hardening: complete() must be idempotent - a retried/duplicate request should
    // never look like a fresh completion or move the completion timestamp forward.
    @Test
    void completingTwiceIsIdempotentAndPreservesOriginalTimestamp() {
        WellnessPreference existing = WellnessPreference.builder()
                .userId(5L).goals(Set.of(WellnessGoal.LESS_STRESS)).build();
        when(repo.findByUserId(5L)).thenReturn(Optional.of(existing));

        WellnessPreferenceResponse first = service.complete(5L);
        Instant firstCompletedAt = existing.getCompletedAt();
        assertNotNull(firstCompletedAt);
        assertTrue(first.completed());

        WellnessPreferenceResponse second = service.complete(5L);

        assertEquals(firstCompletedAt, existing.getCompletedAt(),
                "a second complete() call must not overwrite the original completion timestamp");
        assertTrue(second.completed());
    }
}
