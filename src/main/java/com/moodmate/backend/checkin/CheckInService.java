package com.moodmate.backend.checkin;

import com.moodmate.backend.checkin.dto.CheckInRequest;
import com.moodmate.backend.checkin.dto.CheckInResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mood check-ins are always free (never gated behind Pro) and are recorded independently of the
 * "Log today's mood" daily goal - completing that goal is a separate, explicit toggle the
 * frontend calls against the wellness API, mirroring how the existing UI keeps those two actions
 * decoupled today.
 */
@Service
@RequiredArgsConstructor
public class CheckInService {

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
        return toResponse(checkIn);
    }

    @Transactional(readOnly = true)
    public Page<CheckInResponse> history(Long userId, Pageable pageable) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    private CheckInResponse toResponse(MoodCheckin checkIn) {
        return new CheckInResponse(checkIn.getId(), checkIn.getEmotionKey(), checkIn.getStressLevel(),
                checkIn.getEnergyLevel(), checkIn.getNote(), checkIn.getCreatedAt());
    }
}
