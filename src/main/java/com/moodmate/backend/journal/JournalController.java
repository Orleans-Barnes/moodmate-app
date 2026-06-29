package com.moodmate.backend.journal;

import com.moodmate.backend.journal.dto.JournalEntryRequest;
import com.moodmate.backend.journal.dto.JournalEntryResponse;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;
    private final CurrentUser currentUser;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JournalEntryResponse create(@Valid @RequestBody JournalEntryRequest request) {
        return journalService.create(currentUser.id(), request);
    }

    @GetMapping
    public Page<JournalEntryResponse> list(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return journalService.list(currentUser.id(), PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public JournalEntryResponse get(@PathVariable Long id) {
        return journalService.get(currentUser.id(), id);
    }

    @PutMapping("/{id}")
    public JournalEntryResponse update(@PathVariable Long id, @Valid @RequestBody JournalEntryRequest request) {
        return journalService.update(currentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        journalService.delete(currentUser.id(), id);
    }
}
