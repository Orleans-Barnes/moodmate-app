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

/** Phase 1H (Admin Portal - System Settings). See FeatureFlag's own doc comment for the scope
 * limit: this ships the admin CRUD only, no consumer anywhere checks a flag's value yet. */
@Service
@RequiredArgsConstructor
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;

    @Transactional(readOnly = true)
    public List<FeatureFlagView> list() {
        return featureFlagRepository.findAllByOrderByFlagKeyAsc().stream().map(this::toView).toList();
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
