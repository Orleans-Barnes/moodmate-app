package com.moodmate.support.dto;

public record PeerMentorDto(Long id, String name, String bio, String avatarEmoji, String focusArea,
                             boolean available) {
}
