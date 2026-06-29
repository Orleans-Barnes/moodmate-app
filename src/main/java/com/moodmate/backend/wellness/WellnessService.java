package com.moodmate.backend.wellness;

import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.config.TreeProperties;
import com.moodmate.backend.wallet.TreeSkinRepository;
import com.moodmate.backend.wellness.dto.GoalDto;
import com.moodmate.backend.wellness.dto.ToggleGoalResponse;
import com.moodmate.backend.wellness.dto.WellnessStateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WellnessService {

    private final WellnessProfileRepository wellnessProfileRepository;
    private final DailyGoalTemplateRepository goalTemplateRepository;
    private final GoalCompletionRepository goalCompletionRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final TreeProperties treeProperties;

    @Transactional(readOnly = true)
    public WellnessStateResponse getState(Long userId) {
        WellnessProfile profile = findProfile(userId);
        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Flips a single goal's done flag for today and re-runs {@link GoalEngine} to update XP,
     * streak, and tree stage. See GoalEngine's class doc for the exact contract being preserved.
     */
    @Transactional
    public ToggleGoalResponse toggleGoal(Long userId, String goalKey) {
        WellnessProfile profile = findProfile(userId);
        DailyGoalTemplate template = goalTemplateRepository.findByKey(goalKey)
                .filter(DailyGoalTemplate::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Unknown or inactive goal: " + goalKey));

        LocalDate today = LocalDate.now();
        GoalCompletion completion = goalCompletionRepository
                .findByUserIdAndGoalTemplateIdAndCompletionDate(userId, template.getId(), today)
                .orElseGet(() -> GoalCompletion.builder()
                        .userId(userId)
                        .goalTemplateId(template.getId())
                        .completionDate(today)
                        .done(false)
                        .build());

        boolean wasDoneBefore = completion.isDone();
        completion.setDone(!wasDoneBefore);
        goalCompletionRepository.save(completion);

        List<DailyGoalTemplate> activeTemplates = goalTemplateRepository.findByActiveTrueOrderBySortOrder();
        Map<Long, Boolean> doneByTemplateId = goalCompletionRepository
                .findByUserIdAndCompletionDate(userId, today).stream()
                .collect(Collectors.toMap(GoalCompletion::getGoalTemplateId, GoalCompletion::isDone));
        // Belt-and-suspenders: make sure the row we just flipped is reflected even if the query
        // above raced with the flush above.
        doneByTemplateId.put(template.getId(), completion.isDone());

        boolean allDone = activeTemplates.stream()
                .allMatch(t -> doneByTemplateId.getOrDefault(t.getId(), false));

        List<GoalEngine.GoalDef> goalDefs = activeTemplates.stream()
                .map(t -> new GoalEngine.GoalDef(t.getId(), t.getXp()))
                .toList();

        GoalEngine.WellnessState before = new GoalEngine.WellnessState(
                profile.getTreeXp(), profile.getStreakCount(), profile.getLastAllGoalsCompletedDate());

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(
                before, goalDefs, template.getId(), wasDoneBefore, allDone, today);

        profile.setTreeXp(result.newTreeXp());
        profile.setStreakCount(result.newStreakCount());
        profile.setLastAllGoalsCompletedDate(result.newLastAllGoalsCompletedDate());
        profile.setTreeStage(GoalEngine.stageForXp(result.newTreeXp(), treeProperties.xpMax()));
        wellnessProfileRepository.save(profile);

        return new ToggleGoalResponse(toStateResponse(profile, todaysGoals(userId)), result.streakIncrementedThisToggle());
    }

    private List<GoalDto> todaysGoals(Long userId) {
        LocalDate today = LocalDate.now();
        List<DailyGoalTemplate> activeTemplates = goalTemplateRepository.findByActiveTrueOrderBySortOrder();
        Map<Long, Boolean> doneByTemplateId = goalCompletionRepository.findByUserIdAndCompletionDate(userId, today)
                .stream()
                .collect(Collectors.toMap(GoalCompletion::getGoalTemplateId, GoalCompletion::isDone));

        return activeTemplates.stream()
                .map(t -> new GoalDto(t.getId(), t.getKey(), t.getLabel(), t.getXp(),
                        doneByTemplateId.getOrDefault(t.getId(), false)))
                .toList();
    }

    private WellnessProfile findProfile(Long userId) {
        return wellnessProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wellness profile not found - this should be created automatically on signup"));
    }

    private WellnessStateResponse toStateResponse(WellnessProfile profile, List<GoalDto> todaysGoals) {
        String emoji = treeSkinRepository.findById(profile.getTreeSkinId())
                .map(com.moodmate.backend.wallet.TreeSkin::getEmoji)
                .orElse("🌳");

        return new WellnessStateResponse(
                profile.getTreeXp(),
                treeProperties.xpMax(),
                profile.getTreeStage(),
                emoji,
                profile.getLeafBalance(),
                profile.getStreakCount(),
                profile.getLastAllGoalsCompletedDate(),
                todaysGoals
        );
    }
}
