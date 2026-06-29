package com.moodmate.backend.sos;

import com.moodmate.backend.sos.dto.SosResourceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public, unauthenticated crisis resources endpoint. Whitelisted in SecurityConfig
 * ("/api/sos/**") - per firm product/ethics rule, this must never require login or Pro.
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
