package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.WellnessEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WellnessEventRepository extends JpaRepository<WellnessEvent, Long> {

    Page<WellnessEvent> findAllByOrderByStartsAtAsc(Pageable pageable);

    /**
     * Fix for the RSVP capacity race condition flagged in review: HubService.rsvp() used to
     * read the current RSVP count, then insert with no locking, so two concurrent requests near
     * capacity could both pass the check and overbook the event. This locks the event row for the
     * rest of the transaction, serializing RSVPs on the same event so the count-then-insert
     * sequence can no longer race.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from WellnessEvent e where e.id = :id")
    Optional<WellnessEvent> findByIdForUpdate(@Param("id") Long id);
}
