package com.moodmate.journal.service;

import com.moodmate.journal.client.CrisisServiceClient;
import com.moodmate.journal.client.PaymentsServiceClient;
import com.moodmate.journal.config.JournalUsageProperties;
import com.moodmate.journal.dto.JournalEntryRequest;
import com.moodmate.journal.dto.JournalEntryResponse;
import com.moodmate.journal.dto.UserLastJournalEntryResponse;
import com.moodmate.journal.entity.JournalEntry;
import com.moodmate.journal.exception.ApiException;
import com.moodmate.journal.repository.JournalEntryRepository;
import com.moodmate.journal.util.CrisisKeywordDetector;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final CrisisServiceClient crisisServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    private final JournalUsageProperties journalUsageProperties;

    @Transactional
    public JournalEntryResponse create(Long userId, JournalEntryRequest request) {
        // Premium Enforcement: server-side total-entries cap for free-tier accounts. Checked
        // before the crisis scan/save - Pro status comes from wallet-service itself, never from
        // anything the client sends, so this can't be bypassed from the app.
        if (journalUsageProperties.freeEntryLimit() > 0 && !paymentsServiceClient.isPro(userId)) {
            long existing = journalEntryRepository.countByUserId(userId);
            if (existing >= journalUsageProperties.freeEntryLimit()) {
                throw new ApiException(
                        "You've reached the free plan's " + journalUsageProperties.freeEntryLimit()
                                + "-entry journal limit. Upgrade to MoodMate Pro for unlimited entries.",
                        HttpStatus.PAYMENT_REQUIRED);
            }
        }

        checkForCrisisLanguage(userId, request.body());

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.title())
                .body(request.body())
                .moodEmoji(request.moodEmoji())
                .tags(request.tags() != null ? new HashSet<>(request.tags()) : new HashSet<>())
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
        checkForCrisisLanguage(userId, request.body());

        JournalEntry entry = findOwned(userId, entryId);
        entry.setTitle(request.title());
        entry.setBody(request.body());
        entry.setMoodEmoji(request.moodEmoji());
        // Feature 12: null tags means "leave untouched" (see JournalEntryRequest's doc comment) -
        // only overwrite when the client actually sent a tags value.
        if (request.tags() != null) {
            entry.setTags(new HashSet<>(request.tags()));
        }
        return toResponse(journalEntryRepository.save(entry));
    }

    /**
     * Feature 12 (Search, Date Filters, Emotion Filters, Tags, Favorites) - additive alongside
     * list(); every filter parameter is optional/nullable, and passing all nulls is equivalent to
     * list(). dateFrom/dateTo are inclusive bounds on createdAt. emotion filters by the existing
     * moodEmoji field (no separate "emotion" column was needed). tag matches a single tag exactly.
     */
    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> search(Long userId, String q, Instant dateFrom, Instant dateTo,
                                              String emotion, Boolean favorite, String tag, Pageable pageable) {
        String search = (q == null || q.isBlank()) ? null : q.trim();
        return journalEntryRepository.search(userId, search, dateFrom, dateTo, emotion, favorite, tag, pageable)
                .map(this::toResponse);
    }

    // Feature 12 (Favorites). Explicit set-to-value, not a toggle - see FavoriteRequest's doc
    // comment for why.
    @Transactional
    public JournalEntryResponse setFavorite(Long userId, Long entryId, boolean favorite) {
        JournalEntry entry = findOwned(userId, entryId);
        entry.setFavorite(favorite);
        return toResponse(journalEntryRepository.save(entry));
    }

    // Feature 12 (Tags). Replaces the entry's full tag set - see UpdateTagsRequest's doc comment.
    @Transactional
    public JournalEntryResponse updateTags(Long userId, Long entryId, Set<String> tags) {
        JournalEntry entry = findOwned(userId, entryId);
        entry.setTags(new HashSet<>(tags));
        return toResponse(journalEntryRepository.save(entry));
    }

    // Feature 12 (Tags): distinct tags this user has used, for a filter-chip UI.
    @Transactional(readOnly = true)
    public List<String> listTags(Long userId) {
        return journalEntryRepository.findDistinctTagsByUserId(userId);
    }

    /**
     * Scans a journal entry's body for crisis keywords before it's saved - see
     * CrisisKeywordDetector's doc comment for what this is (a broad, non-clinical heuristic) and
     * isn't. Runs on both create() and update(), since edited content can introduce concerning
     * language just as easily as new content. A detected match files an alert with moodmate-crisis
     * (source JOURNAL) - CrisisServiceClient makes that call best-effort (logged, never thrown), so
     * a crisis-service outage can never block a student from saving their journal entry.
     */
    private void checkForCrisisLanguage(Long userId, String body) {
        CrisisKeywordDetector.Detection detection = CrisisKeywordDetector.detect(body);
        if (detection != null) {
            crisisServiceClient.raiseAlert(userId, body, detection.matchedKeywords(), detection.severity());
        }
    }

    @Transactional
    public void delete(Long userId, Long entryId) {
        journalEntryRepository.delete(findOwned(userId, entryId));
    }

    // Additive - not in the monolith, kept from the pre-existing service stub for a possible
    // entry-count UI element.
    @Transactional(readOnly = true)
    public long count(Long userId) {
        return journalEntryRepository.countByUserId(userId);
    }

    /** Phase 1E, Step 4 - backs GET /internal/journal/latest-per-user. Converts each user's raw
     * MAX(createdAt) Instant to a UTC LocalDate here, once, so moodmate-notifications' scheduled
     * job can compare it directly against "today" - same split as moodmate-mood's
     * MoodService.latestCheckInPerUser(). */
    @Transactional(readOnly = true)
    public List<UserLastJournalEntryResponse> latestEntryPerUser() {
        return journalEntryRepository.findLatestEntryPerUser().stream()
                .map(s -> new UserLastJournalEntryResponse(s.userId(), LocalDate.ofInstant(s.lastEntryAt(), ZoneOffset.UTC)))
                .toList();
    }

    private JournalEntry findOwned(Long userId, Long entryId) {
        return journalEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ApiException("Journal entry not found: " + entryId, HttpStatus.NOT_FOUND));
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        // entry.getTags() alone hands back a reference to Hibernate's lazy-loading proxy (tags is
        // @ElementCollection(fetch = LAZY)) rather than actually reading it - for entries loaded
        // from the DB (list()/search()/get()), that proxy only resolves later when Jackson
        // serializes the HTTP response, by which point the transaction/session has already closed,
        // throwing LazyInitializationException ("could not initialize proxy - no Session"). Wrapping
        // in a plain HashSet here forces the read to happen now, while the session from this
        // @Transactional method is still open. (create()/update() didn't show this bug because their
        // entries are freshly built in memory with a plain HashSet, never a Hibernate proxy.)
        return new JournalEntryResponse(entry.getId(), entry.getTitle(), entry.getBody(), entry.getMoodEmoji(),
                entry.isFavorite(), new HashSet<>(entry.getTags()), entry.getCreatedAt(), entry.getUpdatedAt());
    }
}
