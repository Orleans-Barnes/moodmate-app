package com.moodmate.mood.service;

import com.moodmate.mood.dto.CheckInRequest;
import com.moodmate.mood.dto.CheckInResponse;
import com.moodmate.mood.dto.MoodHistoryResponse;
import com.moodmate.mood.dto.UserLastCheckInResponse;
import com.moodmate.mood.entity.MoodCheckin;
import com.moodmate.mood.repository.MoodCheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Mood check-ins are always free (never gated behind Pro) and are recorded independently of the
 * "Log today's mood" daily goal in wellness-service - completing that goal is a separate, explicit
 * toggle the frontend calls against the wellness API, mirroring how the monolith kept those two
 * actions decoupled. Matches the monolith's com.moodmate.backend.checkin.CheckInService contract
 * (recordCheckIn/history), plus a few additive analytics methods kept from the pre-existing
 * service stub - see MoodHistoryResponse's doc comment.
 */
@Service
@RequiredArgsConstructor
public class MoodService {

    private final MoodCheckinRepository repository;

    @Transactional
    public CheckInResponse recordCheckIn(Long userId, CheckInRequest request) {
        MoodCheckin checkIn = MoodCheckin.builder()
                .userId(userId)
                .emotionKey(request.emotionKey())
                .stressLevel((short) request.stressLevel())
                .energyLevel((short) request.energyLevel())
                .note(request.note())
                .build();

        checkIn = repository.save(checkIn);
        return toDto(checkIn);
    }

    @Transactional(readOnly = true)
    public Page<CheckInResponse> history(Long userId, Pageable pageable) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public MoodHistoryResponse trend(Long userId, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<MoodHistoryResponse.DataPoint> points = repository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since)
                .stream()
                .map(c -> new MoodHistoryResponse.DataPoint(c.getEmotionKey(), c.getStressLevel(),
                        c.getEnergyLevel(), c.getCreatedAt()))
                .toList();
        return new MoodHistoryResponse(points);
    }

    @Transactional(readOnly = true)
    public long countForUser(Long userId) {
        return repository.countByUserId(userId);
    }

    /** Phase 1E, Step 4 - backs GET /internal/mood/latest-per-user. Converts each user's raw
     * MAX(createdAt) Instant to a UTC LocalDate here, once, so moodmate-notifications' scheduled
     * job can compare it directly against "today" without needing to know or care what time zone
     * this service stores timestamps in (matches this service's own
     * hibernate.jdbc.time_zone: UTC configuration). */
    @Transactional(readOnly = true)
    public List<UserLastCheckInResponse> latestCheckInPerUser() {
        return repository.findLatestCheckInPerUser().stream()
                .map(s -> new UserLastCheckInResponse(s.userId(), LocalDate.ofInstant(s.lastCheckInAt(), ZoneOffset.UTC)))
                .toList();
    }

    private CheckInResponse toDto(MoodCheckin checkIn) {
        return new CheckInResponse(checkIn.getId(), checkIn.getEmotionKey(), checkIn.getStressLevel(),
                checkIn.getEnergyLevel(), checkIn.getNote(), checkIn.getCreatedAt());
    }
}
