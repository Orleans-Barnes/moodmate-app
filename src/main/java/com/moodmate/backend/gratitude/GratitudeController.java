package com.moodmate.backend.gratitude;

import com.moodmate.backend.gratitude.dto.GratitudeEntryRequest;
import com.moodmate.backend.gratitude.dto.GratitudeEntryResponse;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gratitude")
@RequiredArgsConstructor
public class GratitudeController {

    private final GratitudeService gratitudeService;
    private final CurrentUser currentUser;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GratitudeEntryResponse create(@Valid @RequestBody GratitudeEntryRequest request) {
        return gratitudeService.create(currentUser.id(), request);
    }

    @GetMapping
    public Page<GratitudeEntryResponse> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return gratitudeService.list(currentUser.id(), PageRequest.of(page, size));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        gratitudeService.delete(currentUser.id(), id);
    }
}
