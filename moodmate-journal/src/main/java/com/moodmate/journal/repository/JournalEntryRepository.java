package com.moodmate.journal.repository;

import com.moodmate.journal.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    Page<JournalEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);

    // Additive - not in the monolith, kept for a possible entry-count UI element.
    long countByUserId(Long userId);

    /**
     * Feature 12 (Journal Improvements): a single flexible query backing Search, Date Filters,
     * Emotion Filters, Tags, and Favorites. Every filter param is optional (":x IS NULL OR ...")
     * so passing all nulls reproduces the same rows/order as findByUserIdOrderByCreatedAtDesc -
     * this is a new, additive endpoint though, not a replacement for that method or its existing
     * callers. DISTINCT is required because of the LEFT JOIN against the tags collection table
     * (an entry with multiple tags would otherwise fan out into duplicate rows); an explicit
     * countQuery keeps Spring Data's derived pagination count accurate against that same join
     * instead of relying on its automatic count-query derivation.
     */
    @Query(value = """
            SELECT DISTINCT e FROM JournalEntry e LEFT JOIN e.tags t
            WHERE e.userId = :userId
            AND (:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(e.body) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:dateFrom IS NULL OR e.createdAt >= :dateFrom)
            AND (:dateTo IS NULL OR e.createdAt <= :dateTo)
            AND (:emotion IS NULL OR e.moodEmoji = :emotion)
            AND (:favorite IS NULL OR e.favorite = :favorite)
            AND (:tag IS NULL OR t = :tag)
            """,
            countQuery = """
            SELECT COUNT(DISTINCT e) FROM JournalEntry e LEFT JOIN e.tags t
            WHERE e.userId = :userId
            AND (:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(e.body) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:dateFrom IS NULL OR e.createdAt >= :dateFrom)
            AND (:dateTo IS NULL OR e.createdAt <= :dateTo)
            AND (:emotion IS NULL OR e.moodEmoji = :emotion)
            AND (:favorite IS NULL OR e.favorite = :favorite)
            AND (:tag IS NULL OR t = :tag)
            """)
    Page<JournalEntry> search(@Param("userId") Long userId, @Param("search") String search,
                               @Param("dateFrom") Instant dateFrom, @Param("dateTo") Instant dateTo,
                               @Param("emotion") String emotion, @Param("favorite") Boolean favorite,
                               @Param("tag") String tag, Pageable pageable);

    // Feature 12 (Tags): distinct tags this user has used across all their entries, for building
    // a filter-chip UI. Ordered alphabetically for a stable, predictable display order.
    @Query("SELECT DISTINCT t FROM JournalEntry e JOIN e.tags t WHERE e.userId = :userId ORDER BY t ASC")
    List<String> findDistinctTagsByUserId(@Param("userId") Long userId);
}
