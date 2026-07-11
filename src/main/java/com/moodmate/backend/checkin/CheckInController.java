package com.moodmate.backend.checkin;

import com.moodmate.backend.checkin.dto.CheckInRequest;
import com.moodmate.backend.checkin.dto.CheckInResponse;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;
    private final CurrentUser currentUser;

    @PostMapping
    public ResponseEntity<CheckInResponse> create(@Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checkInService.recordCheckIn(currentUser.id(), request));
    }

    @GetMapping
    public Page<CheckInResponse> history(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return checkInService.history(currentUser.id(), PageRequest.of(page, size));
    }
}
