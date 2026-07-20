package com.moodmate.admin.service;

import com.moodmate.admin.dto.InstitutionInput;
import com.moodmate.admin.dto.InstitutionView;
import com.moodmate.admin.entity.Institution;
import com.moodmate.admin.entity.InstitutionType;
import com.moodmate.admin.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Institution Management (Milestone). Same CRUD shape as FeatureFlagService: no self audit-log
 * call, since nothing else in this module's own AdminController-facing services (feature flags,
 * whitelist) audit-logs its own writes either - audit logging here is only used for OTHER
 * services' admin-triggered actions reported cross-service via AuditLogServiceClient (see
 * AuditLogService's own doc comment). Kept consistent rather than inventing a new pattern. */
@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;

    @Transactional(readOnly = true)
    public List<InstitutionView> list() {
        return institutionRepository.findAllByOrderByNameAsc().stream().map(this::toView).toList();
    }

    /** Unauthenticated - backs GET /api/public/institutions for the signup picker. Active only,
     * already sorted alphabetically by the query. */
    @Transactional(readOnly = true)
    public List<InstitutionView> listActive() {
        return institutionRepository.findAllByActiveTrueOrderByNameAsc().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public InstitutionView get(Long id) {
        return toView(findOrThrow(id));
    }

    @Transactional
    public InstitutionView create(InstitutionInput input) {
        if (institutionRepository.existsByShortNameIgnoreCase(input.shortName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An institution with this short name already exists");
        }
        Institution institution = Institution.builder()
                .name(input.name())
                .shortName(input.shortName())
                .city(input.city())
                .country(input.country())
                .type(parseType(input.type()))
                .active(true)
                .website(input.website())
                .logoUrl(input.logoUrl())
                .build();
        return toView(institutionRepository.save(institution));
    }

    @Transactional
    public InstitutionView update(Long id, InstitutionInput input) {
        Institution institution = findOrThrow(id);
        if (!institution.getShortName().equalsIgnoreCase(input.shortName())
                && institutionRepository.existsByShortNameIgnoreCase(input.shortName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An institution with this short name already exists");
        }
        institution.setName(input.name());
        institution.setShortName(input.shortName());
        institution.setCity(input.city());
        institution.setCountry(input.country());
        institution.setType(parseType(input.type()));
        institution.setWebsite(input.website());
        institution.setLogoUrl(input.logoUrl());
        return toView(institutionRepository.save(institution));
    }

    @Transactional
    public InstitutionView setActive(Long id, boolean active) {
        Institution institution = findOrThrow(id);
        institution.setActive(active);
        return toView(institutionRepository.save(institution));
    }

    private Institution findOrThrow(Long id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found: " + id));
    }

    private InstitutionType parseType(String type) {
        try {
            return InstitutionType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown institution type: " + type);
        }
    }

    private InstitutionView toView(Institution i) {
        return new InstitutionView(i.getId(), i.getName(), i.getShortName(), i.getCity(), i.getCountry(),
                i.getType().name(), i.isActive(), i.getWebsite(), i.getLogoUrl(),
                i.getLicenseType(), i.getLicenseExpiry(), i.getStudentLimit(), i.getCreatedAt(), i.getUpdatedAt());
    }
}
