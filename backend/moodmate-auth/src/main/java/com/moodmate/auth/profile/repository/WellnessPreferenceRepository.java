package com.moodmate.auth.profile.repository;

import com.moodmate.auth.profile.entity.WellnessPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WellnessPreferenceRepository extends JpaRepository<WellnessPreference, Long> {
    Optional<WellnessPreference> findByUserId(Long userId);
}
