package com.moodmate.crisis.repository;

import com.moodmate.crisis.entity.CrisisAlert;
import com.moodmate.crisis.entity.CrisisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrisisAlertRepository extends JpaRepository<CrisisAlert, Long> {
    List<CrisisAlert> findByStatusOrderByCreatedAtDesc(CrisisStatus status);
    List<CrisisAlert> findAllByOrderByCreatedAtDesc();
    long countByStatus(CrisisStatus status);
}
