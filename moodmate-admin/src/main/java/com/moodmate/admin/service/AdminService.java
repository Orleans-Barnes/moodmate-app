package com.moodmate.admin.service;

import com.moodmate.admin.dto.AdminStatsResponse;
import com.moodmate.admin.dto.HealthPulseResponse;
import com.moodmate.admin.dto.WhitelistEntryDto;
import com.moodmate.admin.entity.WhitelistEntry;
import com.moodmate.admin.repository.WhitelistEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * DELIBERATE, SCOPED EXCEPTION to this system's "each service owns its own schema, nothing reads
 * another service's tables directly" rule (the same rule that's why /internal/** endpoints exist
 * on auth-service and wallet-service). This is a read-only reporting/analytics service - it never
 * writes to any of these tables and never serves anything an end-user request depends on, only an
 * admin dashboard. That's a common, accepted pattern for a reporting service in real microservice
 * systems (think of it as a lightweight substitute for a proper data warehouse / read replica),
 * unlike a regular service reaching into another's tables to satisfy a live user-facing request,
 * which would defeat the entire point of splitting the schemas apart.
 *
 * All table references below are schema-qualified (auth.users, mood.mood_checkins,
 * support.counsellors, support.sos_resources, community.community_posts) because this service's
 * own JDBC connection defaults to the "admin" schema's search_path and owns no tables of its own -
 * every query here reads across schema boundaries on purpose. This only works because every
 * service's schema lives on the same shared Postgres instance under the same DB user (see
 * DB_USERNAME/DB_PASSWORD in .env.example) - it would not work against genuinely separate database
 * instances, which is the point at which this pattern would need to become real internal HTTP
 * endpoints on each owning service instead.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final JdbcTemplate jdbc;
    private final WhitelistEntryRepository whitelistRepository;

    /** Backs the frontend's GET /api/admin/stats - a different, simpler summary than
     * healthPulse() (that one's for an ops-style dashboard; this one matches exactly what the
     * frontend's AdminStats type expects). Same schema-qualified cross-service reads as
     * healthPulse - see the class-level doc comment. */
    public AdminStatsResponse stats() {
        long totalStudents = queryCount("SELECT COUNT(*) FROM auth.users WHERE is_guest = false");
        long totalCounsellors = queryCount("SELECT COUNT(*) FROM support.counsellors WHERE status = 'APPROVED'");
        long totalAppointments = queryCount("SELECT COUNT(*) FROM support.appointments");
        long pendingCounsellorRequests = queryCount("SELECT COUNT(*) FROM support.counsellors WHERE status = 'PENDING'");
        long totalCommunityPosts = queryCount("SELECT COUNT(*) FROM community.community_posts");

        return new AdminStatsResponse(totalStudents, totalCounsellors, totalAppointments,
                pendingCounsellorRequests, totalCommunityPosts);
    }

    // ── Counsellor whitelist - the one thing this service owns outright, everything else here
    // is read-only cross-schema queries (see class-level doc comment) ──────────────────────────

    @Transactional(readOnly = true)
    public List<WhitelistEntryDto> listWhitelist() {
        return whitelistRepository.findAllByOrderByAddedAtDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public WhitelistEntryDto addToWhitelist(String email, String notes) {
        String normalized = email.toLowerCase().trim();
        if (whitelistRepository.findByEmail(normalized).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already whitelisted");
        }
        WhitelistEntry entry = WhitelistEntry.builder().email(normalized).notes(notes).build();
        return toDto(whitelistRepository.save(entry));
    }

    @Transactional
    public void removeFromWhitelist(String email) {
        String normalized = email.toLowerCase().trim();
        whitelistRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No whitelist entry for " + email));
        whitelistRepository.deleteByEmail(normalized);
    }

    private WhitelistEntryDto toDto(WhitelistEntry e) {
        return new WhitelistEntryDto(e.getId(), e.getEmail(), e.getNotes(), e.getAddedAt());
    }

    public HealthPulseResponse healthPulse() {
        long totalUsers = queryCount("SELECT COUNT(*) FROM auth.users WHERE is_guest = false");
        long activeToday = queryCount(
                "SELECT COUNT(DISTINCT user_id) FROM mood.mood_checkins WHERE created_at::date = CURRENT_DATE");
        long checkinsToday = queryCount(
                "SELECT COUNT(*) FROM mood.mood_checkins WHERE created_at::date = CURRENT_DATE");
        long pendingCounsellors = queryCount(
                "SELECT COUNT(*) FROM support.counsellors WHERE status = 'PENDING'");
        long flaggedPosts = queryCount(
                "SELECT COUNT(*) FROM community.community_posts WHERE is_flagged = true");
        // SOS is a public, unauthenticated read endpoint with no activation/click tracking
        // anywhere in the system - this counts configured crisis resources, not actual usage.
        // Kept as a placeholder (as it was in the original monolith-era draft of this query);
        // real usage tracking would need a new event to be recorded somewhere first.
        long sosResourcesConfigured = queryCount("SELECT COUNT(*) FROM support.sos_resources");

        Double avgStress = jdbc.queryForObject(
                "SELECT AVG(stress_level) FROM mood.mood_checkins WHERE created_at >= NOW() - INTERVAL '30 days'",
                Double.class);

        return new HealthPulseResponse(totalUsers, activeToday, checkinsToday,
                pendingCounsellors, flaggedPosts, sosResourcesConfigured,
                avgStress != null ? Math.round(avgStress * 10.0) / 10.0 : 0.0);
    }

    public List<Map<String, Object>> dailyCheckinChart(int days) {
        return jdbc.queryForList(
                "SELECT created_at::date AS day, COUNT(*) AS checkins, AVG(stress_level) AS avg_stress " +
                        "FROM mood.mood_checkins WHERE created_at >= NOW() - INTERVAL '" + days + " days' " +
                        "GROUP BY day ORDER BY day");
    }

    public List<Map<String, Object>> moodDistribution() {
        return jdbc.queryForList(
                "SELECT emotion_key, COUNT(*) as count FROM mood.mood_checkins " +
                        "WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY emotion_key ORDER BY count DESC");
    }

    public List<Map<String, Object>> institutionBreakdown() {
        return jdbc.queryForList(
                "SELECT institution, COUNT(*) as count FROM auth.users WHERE is_guest = false " +
                        "GROUP BY institution ORDER BY count DESC");
    }

    private long queryCount(String sql) {
        Long v = jdbc.queryForObject(sql, Long.class);
        return v != null ? v : 0L;
    }
}
