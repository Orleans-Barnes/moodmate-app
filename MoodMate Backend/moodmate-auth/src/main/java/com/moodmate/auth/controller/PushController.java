package com.moodmate.auth.controller;

import com.moodmate.auth.dto.PushTokenRequest;
import com.moodmate.auth.service.PushTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {
    private final PushTokenService pushTokenService;

    @PutMapping("/token")
    public ResponseEntity<Void> register(@RequestHeader("X-User-Id") Long userId,
                                          @Valid @RequestBody PushTokenRequest req) {
        pushTokenService.register(userId, req.token());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/token")
    public ResponseEntity<Void> remove(@RequestHeader("X-User-Id") Long userId,
                                        @Valid @RequestBody PushTokenRequest req) {
        pushTokenService.remove(userId, req.token());
        return ResponseEntity.ok().build();
    }
}
