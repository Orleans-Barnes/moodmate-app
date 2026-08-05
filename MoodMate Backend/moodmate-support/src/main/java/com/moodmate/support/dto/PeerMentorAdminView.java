package com.moodmate.support.dto;

import com.moodmate.support.entity.PeerMentorStatus;

/** Phase 1H (Admin Portal - Peer Mentor Management). Adds userId/available on top of the public
 * PeerMentorDto so an admin can see whether a roster row has a real account linked yet (see
 * SupportService.linkMentorAccount, Phase 1G) and whether it's currently deactivated.
 *
 * Fix #4 - also doubles as the admin's pending-applications view (status field), same dual role
 * CounsellorRequestAdminView already plays for counsellors. */
public record PeerMentorAdminView(Long id, Long userId, String name, String bio, String avatarEmoji,
                                   String focusArea, boolean available, PeerMentorStatus status) {
}
