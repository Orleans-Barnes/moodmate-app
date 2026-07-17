package com.moodmate.auth.dto;

import com.moodmate.auth.entity.Role;
import java.time.Instant;

public record UserDto(Long id, String email, String fullName, String institution,
                      String avatarEmoji, String avatarUrl, boolean guest, Role role, Instant createdAt) {}
