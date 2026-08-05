package com.moodmate.admin.service;

import com.moodmate.admin.dto.CreateFeatureFlagRequest;
import com.moodmate.admin.dto.FeatureFlagView;
import com.moodmate.admin.entity.FeatureFlag;
import com.moodmate.admin.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Phase 1H (Admin Portal - System Settings) shipped the admin CRUD. Admin Platform (Milestone 1)
 * added publicFlags() - the first real consumer-facing read, closing the gap FeatureFlag's own
 * doc comment used to describe ("read by nothing else in the system yet"). */
@Service
@RequiredArgsConstructor
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;

    @Transactional(readOnly = true)
    public List<FeatureFlagView> list() {
        return featureFlagRepository.findAllByOrderByFlagKeyAsc().stream().map(this::toView).toList();
    }

    /** Admin Platform (Milestone 1) - flagKey -> enabled, for any authenticated client to check
     * before gating a code path. No description/id/updatedAt exposed - those are admin-CRUD-only
     * details, not needed by a consumer that just wants to know "is X on right now". */
    @Transactional(readOnly = true)
    public Map<String, Boolean> publicFlags() {
        return featureFlagRepository.findAll().stream()
                .collect(Collectors.toMap(FeatureFlag::getFlagKey, FeatureFlag::isEnabled));
    }

    @Transactional
    public FeatureFlagView create(CreateFeatureFlagRequest request) {
        if (featureFlagRepository.existsByFlagKey(request.flagKey())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A flag with this key already exists");
        }
        FeatureFlag flag = FeatureFlag.builder()
                .flagKey(request.flagKey())
                .enabled(request.enabled())
                .description(request.description())
                .build();
        return toView(featureFlagRepository.save(flag));
    }

    @Transactional
    public FeatureFlagView setEnabled(Long id, boolean enabled) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag not found: " + id));
        flag.setEnabled(enabled);
        return toView(featureFlagRepository.save(flag));
    }

    @Transactional
    public void delete(Long id) {
        if (!featureFlagRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flag not found: " + id);
        }
        featureFlagRepository.deleteById(id);
    }

    private FeatureFlagView toView(FeatureFlag f) {
        return new FeatureFlagView(f.getId(), f.getFlagKey(), f.isEnabled(), f.getDescription(), f.getUpdatedAt());
    }
}
