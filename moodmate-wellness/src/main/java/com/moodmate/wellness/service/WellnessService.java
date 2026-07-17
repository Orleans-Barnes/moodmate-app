package com.moodmate.wellness.service;

import com.moodmate.wellness.client.LeafTransactionReason;
import com.moodmate.wellness.client.WalletServiceClient;
import com.moodmate.wellness.client.WalletSummary;
import com.moodmate.wellness.config.TreeProperties;
import com.moodmate.wellness.dto.GoalDto;
import com.moodmate.wellness.dto.ToggleGoalResponse;
import com.moodmate.wellness.dto.WellnessStateResponse;
import com.moodmate.wellness.engine.GoalEngine;
import com.moodmate.wellness.entity.DailyGoalTemplate;
import com.moodmate.wellness.entity.GoalCompletion;
import com.moodmate.wellness.entity.WellnessProfile;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.repository.DailyGoalTemplateRepository;
import com.moodmate.wellness.repository.GoalCompletionRepository;
import com.moodmate.wellness.repository.WellnessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WellnessService {

    private final WellnessProfileRepository wellnessProfileRepository;
    private final DailyGoalTemplateRepository goalTemplateRepository;
    private final GoalCompletionRepository goalCompletionRepository;
    private final TreeProperties treeProperties;
    private final WalletServiceClient walletServiceClient;

    @Transactional
    public WellnessStateResponse getState(Long userId) {
        WellnessProfile profile = getOrCreateProfile(userId);
        reconcileStreakBreak(profile);
        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Flips a single goal's done flag for today and re-runs {@link GoalEngine} to update XP,
     * streak, and tree stage. See GoalEngine's class doc for the exact contract being preserved.
     *
     * Fix #2 from review: when this toggle is the one that completes ALL of today's goals, this
     * now actually credits leaves via wallet-service - the monolith had a GOAL_REWARD enum value
     * and a GoalEngine.credit() function documented as "never fails," but nothing ever called it.
     * The reward amount (treeProperties.leafRewardPerDay()) is a placeholder default - confirm the
     * real number with product (see TreeProperties' doc comment).
     *
     * Note on cross-service consistency: the wallet credit call happens inside this same
     * @Transactional method. If wallet-service is unreachable, the exception propagates and this
     * service's own DB changes (the goal completion, the XP/streak update) roll back too - so a
     * user never sees "goal completed" without either getting the reward or the toggle failing
     * outright. What this does NOT protect against is wallet-service crediting successfully but
     * this service's own commit failing right after - a full saga/outbox pattern would be needed
     * to close that gap completely, which is out of scope for this pass.
     */
    @Transactional
    public ToggleGoalResponse toggleGoal(Long userId, String goalKey) {
        WellnessProfile profile = getOrCreateProfile(userId);
        DailyGoalTemplate template = goalTemplateRepository.findByKey(goalKey)
                .filter(DailyGoalTemplate::isActive)
                .orElseThrow(() -> new ApiException("Unknown or inactive goal: " + goalKey, HttpStatus.NOT_FOUND));

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
        doneByTemplateId.put(template.getId(), completion.isDone());

        boolean allDone = activeTemplates.stream()
                .allMatch(t -> doneByTemplateId.getOrDefault(t.getId(), false));

        List<GoalEngine.GoalDef> goalDefs = activeTemplates.stream()
                .map(t -> new GoalEngine.GoalDef(t.getId(), t.getXp()))
                .toList();

        GoalEngine.WellnessState before = new GoalEngine.WellnessState(
                profile.getTreeXp(), profile.getStreakCount(), profile.getLastAllGoalsCompletedDate(),
                profile.isHasStreakShield(), profile.getDoubleXpActiveUntil());

        GoalEngine.ToggleResult result = GoalEngine.applyToggle(
                before, goalDefs, template.getId(), wasDoneBefore, allDone, today, Instant.now());

        profile.setTreeXp(result.newTreeXp());
        profile.setStreakCount(result.newStreakCount());
        profile.setLastAllGoalsCompletedDate(result.newLastAllGoalsCompletedDate());
        profile.setHasStreakShield(result.hasStreakShield());
        profile.setTreeStage(GoalEngine.stageForXp(result.newTreeXp(), treeProperties.xpMax()));
        wellnessProfileRepository.save(profile);

        if (result.streakIncrementedThisToggle() && treeProperties.leafRewardPerDay() > 0) {
            walletServiceClient.creditLeaves(userId, treeProperties.leafRewardPerDay(), LeafTransactionReason.GOAL_REWARD);
        }

        return new ToggleGoalResponse(toStateResponse(profile, todaysGoals(userId)), result.streakIncrementedThisToggle());
    }

    /**
     * Backs POST /api/wellness/streak/shield. One shield can be active at a time (rejects with 409
     * if the user already has one - no stacking). Debits leaves via wallet-service's new
     * /internal/wallet/debit endpoint FIRST, and only sets the flag if that succeeds, so a failed
     * purchase (insufficient leaves) never grants a free shield.
     */
    @Transactional
    public WellnessStateResponse buyStreakShield(Long userId) {
        WellnessProfile profile = getOrCreateProfile(userId);
        reconcileStreakBreak(profile); // don't let a shield that's actually already been consumed count as "active"

        if (profile.isHasStreakShield()) {
            throw new ApiException("You already have an active streak shield", HttpStatus.CONFLICT);
        }

        int cost = treeProperties.streakShieldCostLeaves();
        boolean debited = walletServiceClient.debitLeaves(userId, cost, LeafTransactionReason.STREAK_SHIELD_PURCHASE);
        if (!debited) {
            throw new ApiException("Not enough leaves to buy a streak shield: need " + cost, HttpStatus.PAYMENT_REQUIRED);
        }

        profile.setHasStreakShield(true);
        wellnessProfileRepository.save(profile);

        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Backs POST /api/wellness/boosts/double-xp (Feature 14 - Shop Improvements). Unlike
     * buyStreakShield, this DOES allow "stacking" a purchase while one is already active - doing
     * so simply extends the window to a fresh full duration from now, rather than rejecting with
     * 409, since (unlike a shield, which either is or isn't consumed atomically) it's reasonable
     * for a player to want to keep a running boost topped up. Debits leaves FIRST, same
     * fail-closed ordering as buyStreakShield, so a failed purchase never grants free boost time.
     */
    @Transactional
    public WellnessStateResponse buyDoubleXpBoost(Long userId) {
        WellnessProfile profile = getOrCreateProfile(userId);

        int cost = treeProperties.doubleXpCostLeaves();
        boolean debited = walletServiceClient.debitLeaves(userId, cost, LeafTransactionReason.DOUBLE_XP_BOOST_PURCHASE);
        if (!debited) {
            throw new ApiException("Not enough leaves to buy a Double XP boost: need " + cost, HttpStatus.PAYMENT_REQUIRED);
        }

        profile.setDoubleXpActiveUntil(Instant.now().plus(treeProperties.doubleXpDurationHours(), ChronoUnit.HOURS));
        wellnessProfileRepository.save(profile);

        return toStateResponse(profile, todaysGoals(userId));
    }

    /**
     * Applies GoalEngine.reconcile()'s streak-break check and persists the result if anything
     * changed. Called on every read (getState) as well as at the start of every toggle (inside
     * applyToggle itself), so a broken streak - or a just-consumed shield - is never stale, even on
     * a day the user opens the app but never toggles a goal.
     */
    private void reconcileStreakBreak(WellnessProfile profile) {
        GoalEngine.WellnessState state = new GoalEngine.WellnessState(
                profile.getTreeXp(), profile.getStreakCount(), profile.getLastAllGoalsCompletedDate(),
                profile.isHasStreakShield(), profile.getDoubleXpActiveUntil());
        GoalEngine.ReconcileResult result = GoalEngine.reconcile(state, LocalDate.now());
        if (result.streakShieldConsumed() || result.streakReset()) {
            profile.setStreakCount(result.streakCount());
            profile.setLastAllGoalsCompletedDate(result.lastAllGoalsCompletedDate());
            profile.setHasStreakShield(result.hasStreakShield());
            wellnessProfileRepository.save(profile);
        }
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

    private WellnessProfile getOrCreateProfile(Long userId) {
        return wellnessProfileRepository.findById(userId)
                .orElseGet(() -> wellnessProfileRepository.save(WellnessProfile.builder().userId(userId).build()));
    }

    private WellnessStateResponse toStateResponse(WellnessProfile profile, List<GoalDto> todaysGoals) {
        WalletSummary wallet = walletServiceClient.getSummary(profile.getUserId());

        return new WellnessStateResponse(
                profile.getTreeXp(),
                treeProperties.xpMax(),
                profile.getTreeStage(),
                wallet.equippedSkinEmoji(),
                wallet.leafBalance(),
                profile.getStreakCount(),
                profile.getLastAllGoalsCompletedDate(),
                todaysGoals,
                profile.isHasStreakShield(),
                profile.getDoubleXpActiveUntil()
        );
    }
}
