package com.moodmate.backend.push;

import com.moodmate.backend.push.dto.RegisterPushTokenRequest;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushTokenController {

    private final PushTokenRepository pushTokenRepository;
    private final CurrentUser currentUser;

    /**
     * Register or update a push token for the authenticated user.
     * If the token already exists (same device, different user after re-login),
     * the userId is updated so notifications go to the right account.
     * Called once after login and on every app foreground.
     */
    @PutMapping("/token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void registerToken(@Valid @RequestBody RegisterPushTokenRequest request) {
        pushTokenRepository.findByToken(request.token())
                .ifPresentOrElse(
                        existing -> existing.setUserId(currentUser.id()),
                        () -> pushTokenRepository.save(PushToken.builder()
                                .userId(currentUser.id())
                                .token(request.token())
                                .build())
                );
    }

    /**
     * Remove a push token — called on logout so the device stops receiving
     * notifications for the signed-out account.
     */
    @DeleteMapping("/token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeToken(@Valid @RequestBody RegisterPushTokenRequest request) {
        pushTokenRepository.deleteByToken(request.token());
    }
}
