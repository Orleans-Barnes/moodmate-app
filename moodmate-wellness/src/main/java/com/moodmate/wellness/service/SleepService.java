package com.moodmate.wellness.service;

import com.moodmate.wellness.dto.*;
import com.moodmate.wellness.engine.SleepEngine;
import com.moodmate.wellness.entity.SleepGoal;
import com.moodmate.wellness.entity.SleepLog;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.repository.SleepGoalRepository;
import com.moodmate.wellness.repository.SleepLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Sleep tracking, kept inside moodmate-wellness alongside habits/goals rather than a new service
 * (same reasoning as HabitService's class doc). POST /api/sleep upserts by (userId, logDate) -
 * see SleepTrackerScreen.tsx's own header comment, which this preserves exactly.
 */
@Service
@RequiredArgsConstructor
public class SleepService {

    private final SleepLogRepository sleepLogRepository;
    private final SleepGoalRepository sleepGoalRepository;

    @Transactional(readOnly = true)
    public List<SleepLogResponse> listLogs(Long userId) {
        return sleepLogRepository.findByUserIdOrderByLogDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Matches the frontend's documented behavior exactly: POSTing for a date that already has a
     * log overwrites it in place rather than creating a duplicate row (enforced by the UNIQUE
     * (user_id, log_date) constraint in V5__add_sleep.sql either way, this just avoids relying on
     * that constraint throwing). */
    @Transactional
    public SleepLogResponse upsertLog(Long userId, UpsertSleepLogRequest request) {
        SleepLog log = sleepLogRepository.findByUserIdAndLogDate(userId, request.logDate())
                .orElseGet(() -> SleepLog.builder().userId(userId).logDate(request.logDate()).build());

        log.setBedtime(request.bedtime());
        log.setWakeTime(request.wakeTime());
        log.setDurationMins(request.durationMins());
        log.setQuality(request.quality());
        log.setNotes(request.notes());

        return toResponse(sleepLogRepository.save(log));
    }

    /** Explicit edit-by-id (Feature spec: "Edit Sleep") - distinct from the upsert-by-date POST
     * above for the case where a client already has a specific log's id and wants to correct it,
     * including changing which date it's filed under. */
    @Transactional
    public SleepLogResponse updateLog(Long userId, Long logId, UpsertSleepLogRequest request) {
        SleepLog log = getOwnedLog(userId, logId);

        if (!log.getLogDate().equals(request.logDate())) {
            sleepLogRepository.findByUserIdAndLogDate(userId, request.logDate()).ifPresent(existing -> {
                throw new ApiException("You already have a sleep log for " + request.logDate(), HttpStatus.CONFLICT);
            });
            log.setLogDate(request.logDate());
        }
        log.setBedtime(request.bedtime());
        log.setWakeTime(request.wakeTime());
        log.setDurationMins(request.durationMins());
        log.setQuality(request.quality());
        log.setNotes(request.notes());

        return toResponse(sleepLogRepository.save(log));
    }

    @Transactional
    public void deleteLog(Long userId, Long logId) {
        SleepLog log = getOwnedLog(userId, logId);
        sleepLogRepository.delete(log);
    }

    @Transactional(readOnly = true)
    public SleepAnalyticsResponse getAnalytics(Long userId, int periodDays) {
        LocalDate today = LocalDate.now();
        LocalDate start = SleepEngine.periodStart(today, periodDays);

        List<SleepLog> logs = sleepLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, start, today);
        List<SleepEngine.NightStat> stats = logs.stream()
                .map(l -> new SleepEngine.NightStat(l.getDurationMins(), l.getQuality()))
                .toList();

        SleepEngine.AnalyticsResult result = SleepEngine.computeAnalytics(stats, periodDays);
        return new SleepAnalyticsResponse(start, today, result.nightsLogged(), result.averageDurationMins(),
                result.averageQuality(), result.consistencyRate(), result.bestQuality(), result.worstQuality());
    }

    @Transactional(readOnly = true)
    public SleepGoalResponse getGoal(Long userId) {
        int minutes = sleepGoalRepository.findById(userId).map(SleepGoal::getTargetMinutes).orElse(480);
        return new SleepGoalResponse(minutes);
    }

    @Transactional
    public SleepGoalResponse updateGoal(Long userId, UpdateSleepGoalRequest request) {
        SleepGoal goal = sleepGoalRepository.findById(userId)
                .orElseGet(() -> SleepGoal.builder().userId(userId).build());
        goal.setTargetMinutes(request.targetMinutes());
        sleepGoalRepository.save(goal);
        return new SleepGoalResponse(goal.getTargetMinutes());
    }

    private SleepLog getOwnedLog(Long userId, Long logId) {
        return sleepLogRepository.findByIdAndUserId(logId, userId)
                .orElseThrow(() -> new ApiException("Sleep log not found: " + logId, HttpStatus.NOT_FOUND));
    }

    private SleepLogResponse toResponse(SleepLog log) {
        return new SleepLogResponse(log.getId(), log.getLogDate(), log.getBedtime(), log.getWakeTime(),
                log.getDurationMins(), log.getQuality(), log.getNotes());
    }
}
