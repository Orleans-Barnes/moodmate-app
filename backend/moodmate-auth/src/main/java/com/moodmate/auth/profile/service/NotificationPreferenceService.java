package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.NotificationPreferenceRequest;
import com.moodmate.auth.profile.dto.NotificationPreferenceResponse;
import com.moodmate.auth.profile.entity.NotificationPreference;
import com.moodmate.auth.profile.mapper.NotificationPreferenceMapper;
import com.moodmate.auth.profile.repository.NotificationPreferenceRepository;
import com.moodmate.auth.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Phase 1E, Step 1. Unlike WellnessPreferenceService, get() always returns a value (creating a
 * default row on first access) rather than an Optional/404 - there's no "hasn't onboarded yet"
 * state to distinguish here, every field already has a sensible default (see V12 migration).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final NotificationPreferenceRepository repo;

    @Transactional
    public NotificationPreferenceResponse get(Long userId) {
        return NotificationPreferenceMapper.toDto(findOrCreate(userId));
    }

    /** Partial-update: a null field means "don't touch". For the two quiet-hours fields, an empty
     *  string ("") explicitly clears that field (distinct from null) - see the request DTO's doc
     *  comment. Both quiet-hours fields must end up either both set or both null; setting only one
     *  is rejected rather than silently left half-configured. */
    @Transactional
    public NotificationPreferenceResponse save(Long userId, NotificationPreferenceRequest req) {
        NotificationPreference pref = findOrCreate(userId);

        if (req.moodReminders() != null) pref.setMoodReminders(req.moodReminders());
        if (req.journalReminders() != null) pref.setJournalReminders(req.journalReminders());
        if (req.habitReminders() != null) pref.setHabitReminders(req.habitReminders());
        if (req.sleepReminders() != null) pref.setSleepReminders(req.sleepReminders());
        if (req.appointmentReminders() != null) pref.setAppointmentReminders(req.appointmentReminders());

        if (req.quietHoursStart() != null) {
            pref.setQuietHoursStart(parseOrClear(req.quietHoursStart(), "quietHoursStart"));
        }
        if (req.quietHoursEnd() != null) {
            pref.setQuietHoursEnd(parseOrClear(req.quietHoursEnd(), "quietHoursEnd"));
        }

        boolean hasStart = pref.getQuietHoursStart() != null;
        boolean hasEnd = pref.getQuietHoursEnd() != null;
        if (hasStart != hasEnd) {
            throw new ApiException(
                    "Set both quietHoursStart and quietHoursEnd together, or clear both",
                    HttpStatus.BAD_REQUEST);
        }

        NotificationPreferenceResponse dto = NotificationPreferenceMapper.toDto(repo.save(pref));
        log.info("Notification preferences updated for user {}", userId);
        return dto;
    }

    /** "" clears the field (returns null); any other value must parse as HH:mm. */
    private static LocalTime parseOrClear(String raw, String fieldName) {
        if (raw.isBlank()) return null;
        try {
            return LocalTime.parse(raw, HH_MM);
        } catch (DateTimeParseException e) {
            throw new ApiException(fieldName + " must be in HH:mm format (e.g. \"22:00\")", HttpStatus.BAD_REQUEST);
        }
    }

    private NotificationPreference findOrCreate(Long userId) {
        return repo.findByUserId(userId)
                .orElseGet(() -> repo.save(NotificationPreference.builder().userId(userId).build()));
    }
}
