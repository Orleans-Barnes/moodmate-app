package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.WellnessPreferenceRequest;
import com.moodmate.auth.profile.dto.WellnessPreferenceResponse;
import com.moodmate.auth.profile.entity.WellnessPreference;
import com.moodmate.auth.profile.enums.Challenge;
import com.moodmate.auth.profile.enums.PreferredSupport;
import com.moodmate.auth.profile.enums.WellnessGoal;
import com.moodmate.auth.profile.mapper.WellnessPreferenceMapper;
import com.moodmate.auth.profile.repository.WellnessPreferenceRepository;
import com.moodmate.auth.profile.validation.EnumValidator;
import com.moodmate.auth.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Phase 1C-i. Plain field saves (save()) never touch completedAt/skippedAt — only the explicit
 * complete()/skip()/prompted() actions do. This is deliberate: it's what makes "user saved one
 * field and left" distinguishable from "user finished the flow" (the bug the original proposal
 * had, using existsByUserId() as a stand-in for completion).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WellnessPreferenceService {

    // Phase 1C-i.6 business rules (distinct from the defensive @Size(max=20) on
    // WellnessPreferenceRequest, which just bounds request payload size against abuse). These are
    // actual product limits, enforced here in the service layer rather than the DTO/controller,
    // per the reviewed guidance that domain rules belong with the domain logic.
    private static final int MAX_GOALS = 5;
    private static final int MAX_CHALLENGES = 3;
    private static final int MAX_PREFERRED_SUPPORT = 3;

    private final WellnessPreferenceRepository repo;

    @Transactional(readOnly = true)
    public Optional<WellnessPreferenceResponse> get(Long userId) {
        return repo.findByUserId(userId).map(WellnessPreferenceMapper::toDto);
    }

    /** Partial-update: a null Set means "don't touch that field"; a non-null Set (even empty)
     *  replaces it entirely — same semantics as StudentProfileService.save(). */
    @Transactional
    public WellnessPreferenceResponse save(Long userId, WellnessPreferenceRequest req) {
        WellnessPreference pref = findOrCreate(userId);

        if (req.goals() != null) {
            var goals = EnumValidator.parseSet(WellnessGoal.class, req.goals(), "goal");
            requireAtMost(goals.size(), MAX_GOALS, "goals");
            pref.setGoals(goals);
        }
        if (req.challenges() != null) {
            var challenges = EnumValidator.parseSet(Challenge.class, req.challenges(), "challenge");
            requireAtMost(challenges.size(), MAX_CHALLENGES, "challenges");
            pref.setChallenges(challenges);
        }
        if (req.preferredSupport() != null) {
            var support = EnumValidator.parseSet(PreferredSupport.class, req.preferredSupport(), "preferredSupport");
            requireAtMost(support.size(), MAX_PREFERRED_SUPPORT, "preferredSupport");
            pref.setPreferredSupport(support);
        }

        WellnessPreferenceResponse dto = WellnessPreferenceMapper.toDto(repo.save(pref));
        // Audit trail: event + who, never the actual goal/challenge/support values - those can be
        // sensitive (e.g. ANXIETY, LONELINESS), so only the fact that a save happened is logged.
        log.info("Wellness preferences updated for user {}", userId);
        return dto;
    }

    /** Explicit "finished the flow" action — the only thing that sets completedAt. Idempotent by
     *  design (Phase 1C-i.5 hardening): a second call finds completedAt already set and leaves it
     *  untouched, so the original completion timestamp is preserved and repeat calls (e.g. a
     *  retried request) never look like a fresh completion.
     *
     *  Phase 1C-i.6: requires at least one goal already saved - "completing" a flow with nothing
     *  selected isn't a meaningful completion. This does NOT contradict the product decision that
     *  onboarding itself must be skippable (see skip()) - a user who doesn't want to engage with
     *  goals at all should call skip(), not complete() with nothing selected. */
    @Transactional
    public WellnessPreferenceResponse complete(Long userId) {
        WellnessPreference pref = findOrCreate(userId);
        if (pref.getGoals().isEmpty()) {
            throw new ApiException("Select at least one goal before completing", HttpStatus.BAD_REQUEST);
        }
        if (pref.getCompletedAt() == null) {
            pref.setCompletedAt(Instant.now());
            log.info("Wellness preferences onboarding completed for user {}", userId);
        }
        return WellnessPreferenceMapper.toDto(repo.save(pref));
    }

    /** Explicit "deferred the flow" action — also stamps lastPromptedAt, since skipping only
     *  happens after the prompt was shown. */
    @Transactional
    public WellnessPreferenceResponse skip(Long userId) {
        WellnessPreference pref = findOrCreate(userId);
        Instant now = Instant.now();
        pref.setSkippedAt(now);
        pref.setLastPromptedAt(now);
        log.info("Wellness preferences onboarding skipped for user {}", userId);
        return WellnessPreferenceMapper.toDto(repo.save(pref));
    }

    /** Called when the UI actually renders the onboarding prompt (not on every profile-status
     *  poll) — keeps the 7-day cooldown honest even if the user neither completes nor explicitly
     *  skips, just dismisses it by navigating away. */
    @Transactional
    public void prompted(Long userId) {
        WellnessPreference pref = findOrCreate(userId);
        pref.setLastPromptedAt(Instant.now());
        repo.save(pref);
    }

    private WellnessPreference findOrCreate(Long userId) {
        return repo.findByUserId(userId).orElseGet(() -> WellnessPreference.builder().userId(userId).build());
    }

    private static void requireAtMost(int actual, int max, String fieldName) {
        if (actual > max) {
            throw new ApiException("At most " + max + " " + fieldName + " may be selected", HttpStatus.BAD_REQUEST);
        }
    }
}
