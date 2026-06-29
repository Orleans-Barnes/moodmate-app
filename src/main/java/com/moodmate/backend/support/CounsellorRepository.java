package com.moodmate.backend.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CounsellorRepository extends JpaRepository<Counsellor, Long> {
    List<Counsellor> findByAvailableTrueOrderBySortOrder();

    List<Counsellor> findByStatusAndAvailableTrueOrderBySortOrder(CounsellorStatus status);

    List<Counsellor> findByStatus(CounsellorStatus status);

    Optional<Counsellor> findByUserId(Long userId);
}
