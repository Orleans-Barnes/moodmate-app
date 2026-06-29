package com.moodmate.backend.auth;

import com.moodmate.backend.auth.dto.UpdateProfileRequest;
import com.moodmate.backend.auth.dto.UserProfileResponse;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    @GetMapping
    public UserProfileResponse me() {
        return toProfile(findCurrent());
    }

    @PutMapping
    @Transactional
    public UserProfileResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = findCurrent();
        user.setFullName(request.fullName().trim());
        user.setInstitution(request.institution());
        if (request.avatarEmoji() != null && !request.avatarEmoji().isBlank()) {
            user.setAvatarEmoji(request.avatarEmoji());
        }
        return toProfile(user);
    }

    private User findCurrent() {
        return userRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getInstitution(), user.getAvatarEmoji(), user.isGuest(), user.getRole());
    }
}
