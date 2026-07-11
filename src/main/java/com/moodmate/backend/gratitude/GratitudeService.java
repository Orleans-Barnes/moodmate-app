package com.moodmate.backend.gratitude;

import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.gratitude.dto.GratitudeEntryRequest;
import com.moodmate.backend.gratitude.dto.GratitudeEntryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GratitudeService {

    private final GratitudeEntryRepository gratitudeEntryRepository;

    @Transactional
    public GratitudeEntryResponse create(Long userId, GratitudeEntryRequest request) {
        GratitudeEntry entry = GratitudeEntry.builder()
                .userId(userId)
                .content(request.content())
                .build();

        return toResponse(gratitudeEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public Page<GratitudeEntryResponse> list(Long userId, Pageable pageable) {
        return gratitudeEntryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional
    public void delete(Long userId, Long entryId) {
        GratitudeEntry entry = gratitudeEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Gratitude entry not found: " + entryId));
        gratitudeEntryRepository.delete(entry);
    }

    private GratitudeEntryResponse toResponse(GratitudeEntry entry) {
        return new GratitudeEntryResponse(entry.getId(), entry.getContent(), entry.getCreatedAt());
    }
}
