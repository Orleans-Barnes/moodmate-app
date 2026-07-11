package com.moodmate.backend.wellness;

import com.moodmate.backend.common.GoalEngine;
import com.moodmate.backend.common.api.SkinLookupApi;
import com.moodmate.backend.common.exception.InsufficientBalanceException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.config.TreeProperties;
import com.moodmate.backend.push.PushNotificationService;
import com.moodmate.backend.wallet.LeafTransaction;
import com.moodmate.backend.wallet.LeafTransactionReason;
import com.moodmate.backend.wallet.LeafTransactionRepository;
import com.moodmate.backend.wellness.dto.GoalDto;
import com.moodmate.backend.wellness.dto.ToggleGoalResponse;
import com.moodmate.backend.wellness.dto.WellnessStateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WellnessService {

    /** Cost in leaves to purchase one streak shield. */
    public static final int SHIELD_COST = 10;

    /** Streak days that trigger a milestone push notification. */
    private static final Set<Integer> MILESTONE_DAYS = Set.of(3, 7, 14, 30);

    private final WellnessProfileRepository wellnessProfileRepository;
    private final DailyGoalTemplateRepository goalTemplateRepository;
    private final GoalCompletionRepository goalCompletionRepository;
    private final LeafTransactionRepository leafTransactionRepository;
    private final SkinLookupApi skinLookupApi;
    private final TreeProperties treeProperties;
    private final PushNotificationService pushNotificationService;

    @Transactional(readOnly = true)
    public WellnessStateResponse getState(Long userId) {
        WellnessProfile profile = findProfile(userId);
        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Spends {@value #SHIELD_COST} leaves to activate a streak shield on the user's profile.
     * The shield absorbs the next streak-break (a gap of more than one day) instead of resetting
     * the streak to 0.  If a shield is already active the purchase is rejected (idempotency guard).
     *
     * @throws InsufficientBalanceException if the user has fewer than {@value #SHIELD_COST} leaves
     * @throws IllegalStateException        if a shield is already active
     */
    @Transactional
    public WellnessStateResponse buyStreakShield(Long userId) {
        WellnessProfile profile = findProfile(userId);

        if (profile.isStreakShieldActive()) {
            throw new IllegalStateException("Streak shield is already active");
        }

        GoalEngine.BalanceMutationResult result = GoalEngine.spend(profile.getLeafBalance(), SHIELD_COST);
        if (!result.success()) {
            throw new InsufficientBalanceException(
                    "Not enough leaves — you need " + SHIELD_COST + " but have " + profile.getLeafBalance());
        }

        profile.setLeafBalance(result.newLeafBalance());
        profile.setStreakShieldActive(true);
        wellnessProfileRepository.save(profile);

        leafTransactionRepository.save(LeafTransaction.builder()
                .userId(userId)
                .amount(-SHIELD_COST)
                .reason(LeafTransactionReason.STREAK_SHIELD)
                .build());

        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Flips a single goal's done flag for today and re-runs {@link GoalEngine} to update XP,
     * streak, and tree stage. See GoalEngine's class doc for the exact contract being preserved.
     *
     * Shield behaviour: if the streak would break (last completed > 1 day ago) and a shield is
     * active, the shield is consumed instead of resetting the streak to 0.
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

        // Shield check: if this toggle would trigger a streak-break AND a shield is active,
        // pretend lastAllGoalsCompletedDate is yesterday so GoalEngine doesn't reset the streak.
        boolean shieldConsumed = false;
        LocalDate effectiveLastCompleted = profile.getLastAllGoalsCompletedDate();
        if (profile.isStreakShieldActive()
                && effectiveLastCompleted != null
                && effectiveLastCompleted.isBefore(today.minusDays(1))) {
            // Absorb the break — act as if the user completed yesterday
            effectiveLastCompleted = today.minusDays(1);
            shieldConsumed = true;
        }

        GoalEngine.WellnessState before = new GoalEngine.WellnessState(
                profile.getTreeXp(), profile.getStreakCount(), effectiveLastCompleted);

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(
                before, goalDefs, template.getId(), wasDoneBefore, allDone, today);

        profile.setTreeXp(result.newTreeXp());
        profile.setStreakCount(result.newStreakCount());
        profile.setLastAllGoalsCompletedDate(result.newLastAllGoalsCompletedDate());
        profile.setTreeStage(GoalEngine.stageForXp(result.newTreeXp(), treeProperties.xpMax()));

        if (shieldConsumed) {
            profile.setStreakShieldActive(false);
        }

        wellnessProfileRepository.save(profile);

        // Send milestone push when the streak hits a landmark day (3/7/14/30)
        if (result.streakIncrementedThisToggle()
                && MILESTONE_DAYS.contains(result.newStreakCount())) {
            sendMilestonePush(userId, result.newStreakCount());
        }

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

    private void sendMilestonePush(Long userId, int streakCount) {
        record Milestone(String title, String body) {}
        Milestone m = switch (streakCount) {
            case  3 -> new Milestone("3-day streak! 🔥",  "You're building a powerful habit. Keep it going!");
            case  7 -> new Milestone("One week streak! 🌟", "A whole week of wellness. You're on fire!");
            case 14 -> new Milestone("Two week streak! 💪", "14 days strong. Nothing can stop you!");
            case 30 -> new Milestone("30-day streak! 🏆",  "A full month! You're a wellness champion.");
            default -> new Milestone(streakCount + "-day streak!", "Amazing consistency. Keep it up!");
        };
        pushNotificationService.sendToUser(
                userId, m.title(), m.body(),
                Map.of("type", "streak-milestone", "streak", streakCount, "screen", "Home")
        );
    }

    private WellnessStateResponse toStateResponse(WellnessProfile profile, List<GoalDto> todaysGoals) {
        String emoji = skinLookupApi.getEmoji(profile.getTreeSkinId());

        return new WellnessStateResponse(
                profile.getTreeXp(),
                treeProperties.xpMax(),
                profile.getTreeStage(),
                emoji,
                profile.getLeafBalance(),
                profile.getStreakCount(),
                profile.getLastAllGoalsCompletedDate(),
                todaysGoals,
                profile.isStreakShieldActive()
        );
    }
}
