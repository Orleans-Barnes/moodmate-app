package com.moodmate.admin.service;

import com.moodmate.admin.client.NotificationsServiceClient;
import com.moodmate.admin.dto.BroadcastAnnouncementRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

/** Phase 1H (Admin Portal - System Settings). Resolves the target audience via the same
 * cross-schema JdbcTemplate read AdminService already uses (see that class's doc comment), then
 * fans out one POST /internal/notifications call per user via NotificationsServiceClient - each
 * lands as both an in-app inbox row and (per PushGatingRule) a push, since ADMIN_ANNOUNCEMENT has
 * no matching per-type preference toggle and so always pushes outside quiet hours by that rule's
 * existing design. This is synchronous/in-request rather than a background job - acceptable at
 * this project's current user-table size; a genuinely large user base would need this queued. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private static final Set<String> VALID_AUDIENCES = Set.of("ALL", "STUDENT", "COUNSELLOR", "MENTOR", "ADMIN");

    private final JdbcTemplate jdbc;
    private final NotificationsServiceClient notificationsServiceClient;

    public int broadcast(BroadcastAnnouncementRequest request) {
        String audience = request.audience().toUpperCase();
        if (!VALID_AUDIENCES.contains(audience)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown audience: " + request.audience());
        }

        List<Long> userIds = audience.equals("ALL")
                ? jdbc.queryForList("SELECT id FROM auth.users WHERE is_guest = false", Long.class)
                : jdbc.queryForList("SELECT id FROM auth.users WHERE is_guest = false AND role = ?", Long.class, audience);

        for (Long userId : userIds) {
            notificationsServiceClient.notify(userId, "ADMIN_ANNOUNCEMENT", request.title(), request.body());
        }
        log.info("Broadcast announcement '{}' sent to {} users (audience={})", request.title(), userIds.size(), audience);
        return userIds.size();
    }
}
