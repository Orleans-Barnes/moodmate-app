package com.moodmate.auth.profile.dto;

import jakarta.validation.constraints.Size;
import java.util.Set;

/**
 * Phase 1C-i. Each field nullable/partial-update, same reasoning as StudentProfileRequest — null
 * means "don't touch", a non-null (even empty) Set replaces that field's whole collection. This
 * does NOT set completedAt — see WellnessPreferenceService.complete()/skip() for the explicit
 * actions that mark the flow finished or deferred, kept separate from plain field saves so a
 * partial save-and-leave is never mistaken for a completed onboarding.
 *
 * Phase 1C-i.5 hardening note: deliberately NOT @NotEmpty — an empty (non-null) Set is a valid,
 * meaningful state here (the user explicitly cleared that field), distinct from null ("don't
 * touch"). @Size(max=...) instead bounds how large a single request can be, independent of the
 * enum's own valid-value check (still enforced by EnumValidator per-element).
 */
public record WellnessPreferenceRequest(
    @Size(max = 20) Set<String> goals,
    @Size(max = 20) Set<String> challenges,
    @Size(max = 20) Set<String> preferredSupport
) {}
