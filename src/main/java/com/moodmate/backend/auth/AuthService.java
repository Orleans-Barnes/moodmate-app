package com.moodmate.backend.auth;

import com.moodmate.backend.auth.dto.AuthResponse;
import com.moodmate.backend.auth.dto.LoginRequest;
import com.moodmate.backend.auth.dto.SignupRequest;
import com.moodmate.backend.auth.dto.UserProfileResponse;
import com.moodmate.backend.common.exception.BadRequestException;
import com.moodmate.backend.common.exception.ConflictException;
import com.moodmate.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .institution(request.institution())
                .guest(false)
                .build();

        user = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toProfile(user));
    }

    /** Frontend's "continue as guest" flow - creates a throwaway, password-less account. */
    @Transactional
    public AuthResponse loginAsGuest() {
        String guestEmail = "guest-" + UUID.randomUUID() + "@moodmate.local";
        User user = User.builder()
                .email(guestEmail)
                .passwordHash(null)
                .fullName("Guest")
                .guest(true)
                .build();

        user = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId()));

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toProfile(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.isGuest() || user.getPasswordHash() == null) {
            throw new BadRequestException("This account can't sign in with a password");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toProfile(user));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getInstitution(), user.getAvatarEmoji(), user.isGuest());
    }
}
