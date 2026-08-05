package com.moodmate.admin.repository;

import com.moodmate.admin.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, Long> {
    List<FeatureFlag> findAllByOrderByFlagKeyAsc();

    Optional<FeatureFlag> findByFlagKey(String flagKey);

    boolean existsByFlagKey(String flagKey);
}
