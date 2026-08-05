package com.moodmate.support.repository;

import com.moodmate.support.entity.Counsellor;
import com.moodmate.support.entity.CounsellorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CounsellorRepository extends JpaRepository<Counsellor, Long> {
    List<Counsellor> findByAvailableTrueOrderBySortOrder();

    List<Counsellor> findByStatusAndAvailableTrueOrderBySortOrder(CounsellorStatus status);

    List<Counsellor> findByStatus(CounsellorStatus status);

    Optional<Counsellor> findByUserId(Long userId);

    // Phase 1H (Admin Portal - Counsellor Management) - backs the "all counsellors, any status"
    // admin listing (approve/reject queue only shows PENDING; this shows everything so an admin
    // can also suspend/reinstate/edit an already-APPROVED row).
    List<Counsellor> findAllByOrderByNameAsc();
}
