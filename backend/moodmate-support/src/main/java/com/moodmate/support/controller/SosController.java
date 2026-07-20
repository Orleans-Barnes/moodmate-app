package com.moodmate.support.controller;

import com.moodmate.support.dto.SosResourceDto;
import com.moodmate.support.entity.SosResource;
import com.moodmate.support.repository.SosResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public, unauthenticated crisis resources endpoint - matches the monolith's SosController route
 * exactly (/api/sos/resources), fixing the pre-existing stub which only had a bare /api/sos root
 * mapping. Never gate this behind auth or Pro - see SosResource's doc comment.
 */
@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosResourceRepository sosResourceRepository;

    @GetMapping("/resources")
    public List<SosResourceDto> resources(@RequestParam(required = false) String country) {
        List<SosResource> resources = StringUtils.hasText(country)
                ? sosResourceRepository.findByCountryOrderBySortOrderAsc(country)
                : sosResourceRepository.findAllByOrderBySortOrderAsc();

        return resources.stream()
                .map(r -> new SosResourceDto(r.getId(), r.getName(), r.getDescription(), r.getPhone(), r.getUrl(), r.getCountry()))
                .toList();
    }
}
