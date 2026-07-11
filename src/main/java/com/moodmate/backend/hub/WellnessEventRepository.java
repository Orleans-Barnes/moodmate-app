package com.moodmate.backend.hub;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WellnessEventRepository extends JpaRepository<WellnessEvent, Long> {

    Page<WellnessEvent> findAllByOrderByStartsAtAsc(Pageable pageable);
}
