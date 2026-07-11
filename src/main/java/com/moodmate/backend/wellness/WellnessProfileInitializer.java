package com.moodmate.backend.wellness;

import com.moodmate.backend.common.GoalEngine;
import com.moodmate.backend.common.api.SkinLookupApi;
import com.moodmate.backend.common.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates the default gamification state for every new user, triggered by signup/guest creation. */
@Component
@RequiredArgsConstructor
public class WellnessProfileInitializer {

    private static final String DEFAULT_SKIN_CODE = "CLASSIC";

    private final WellnessProfileRepository wellnessProfileRepository;
    private final SkinLookupApi skinLookupApi;

    @EventListener
    @Transactional
    public void onUserRegistered(UserRegisteredEvent event) {
        if (wellnessProfileRepository.existsById(event.userId())) {
            return;
        }

        Long defaultSkinId = skinLookupApi.getSkinIdByCode(DEFAULT_SKIN_CODE);

        WellnessProfile profile = WellnessProfile.builder()
                .userId(event.userId())
                .treeXp(0)
                .treeStage(GoalEngine.TreeStage.ROOTS)
                .treeSkinId(defaultSkinId)
                .leafBalance(0)
                .streakCount(0)
                .lastAllGoalsCompletedDate(null)
                .build();

        wellnessProfileRepository.save(profile);
    }
}
