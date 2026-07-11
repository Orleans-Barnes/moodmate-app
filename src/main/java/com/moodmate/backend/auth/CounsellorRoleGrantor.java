package com.moodmate.backend.auth;

import com.moodmate.backend.common.events.CounsellorApprovedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Promotes a user's account to COUNSELLOR once their self-serve counsellor request is approved. */
@Component
@RequiredArgsConstructor
public class CounsellorRoleGrantor {

    private final UserRepository userRepository;

    @EventListener
    @Transactional
    public void onCounsellorApproved(CounsellorApprovedEvent event) {
        userRepository.findById(event.userId()).ifPresent(user -> {
            if (user.getRole() != Role.ADMIN) { // never downgrade/override an existing admin account
                user.setRole(Role.COUNSELLOR);
                userRepository.save(user);
            }
        });
    }
}
