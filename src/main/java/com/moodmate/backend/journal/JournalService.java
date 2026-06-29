package com.moodmate.backend.journal;

import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.journal.dto.JournalEntryRequest;
import com.moodmate.backend.journal.dto.JournalEntryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;

    @Transactional
    public JournalEntryResponse create(Long userId, JournalEntryRequest request) {
        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.title())
                .body(request.body())
                .moodEmoji(request.moodEmoji())
                .build();

        return toResponse(journalEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> list(Long userId, Pageable pageable) {
        return journalEntryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse get(Long userId, Long entryId) {
        return toResponse(findOwned(userId, entryId));
    }

    @Transactional
    public JournalEntryResponse update(Long userId, Long entryId, JournalEntryRequest request) {
        JournalEntry entry = findOwned(userId, entryId);
        entry.setTitle(request.title());
        entry.setBody(request.body());
        entry.setMoodEmoji(request.moodEmoji());
        return toResponse(journalEntryRepository.save(entry));
    }

    @Transactional
    public void delete(Long userId, Long entryId) {
        journalEntryRepository.delete(findOwned(userId, entryId));
    }

    private JournalEntry findOwned(Long userId, Long entryId) {
        return journalEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found: " + entryId));
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        return new JournalEntryResponse(entry.getId(), entry.getTitle(), entry.getBody(), entry.getMoodEmoji(),
                entry.getCreatedAt(), entry.getUpdatedAt());
    }
}
