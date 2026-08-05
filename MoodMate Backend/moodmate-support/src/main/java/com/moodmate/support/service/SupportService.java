package com.moodmate.support.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodmate.support.client.AuthServiceClient;
import com.moodmate.support.client.NotificationsServiceClient;
import com.moodmate.support.client.PaymentsServiceClient;
import com.moodmate.support.client.UserSummary;
import com.moodmate.support.dto.AdminEditCounsellorRequest;
import com.moodmate.support.dto.EscalationCaseView;
import com.moodmate.support.dto.EscalationFeedbackRequest;
import com.moodmate.support.dto.SubmitEscalationRequest;
import com.moodmate.support.entity.EscalationCase;
import com.moodmate.support.entity.EscalationStatus;
import com.moodmate.support.entity.EscalationUrgency;
import com.moodmate.support.repository.EscalationCaseRepository;
import com.moodmate.support.dto.AppointmentResponse;
import com.moodmate.support.dto.BookAppointmentRequest;
import com.moodmate.support.dto.BookedSlotView;
import com.moodmate.support.dto.ConfirmedAppointmentResponse;
import com.moodmate.support.dto.ConversationResponse;
import com.moodmate.support.dto.CounsellorAnalyticsResponse;
import com.moodmate.support.dto.CounsellorAppointmentView;
import com.moodmate.support.dto.CounsellorConversationView;
import com.moodmate.support.dto.CounsellorDto;
import com.moodmate.support.dto.CounsellorRatingResponse;
import com.moodmate.support.dto.CounsellorRequestAdminView;
import com.moodmate.support.dto.CounsellorRequestInput;
import com.moodmate.support.dto.CounsellorRequestResponse;
import com.moodmate.support.dto.SubmitCounsellorRatingRequest;
import com.moodmate.support.dto.LinkMentorAccountRequest;
import com.moodmate.support.dto.MeetingWindowView;
import com.moodmate.support.dto.MentorRequestResponse;
import com.moodmate.support.dto.MentorRequestView;
import com.moodmate.support.dto.MessageResponse;
import com.moodmate.support.dto.PeerMentorAdminView;
import com.moodmate.support.dto.PeerMentorApplicationInput;
import com.moodmate.support.dto.PeerMentorApplicationResponse;
import com.moodmate.support.dto.PeerMentorDto;
import com.moodmate.support.dto.RequestMentorRequest;
import com.moodmate.support.dto.SendMessageRequest;
import com.moodmate.support.dto.StartConversationRequest;
import com.moodmate.support.entity.Appointment;
import com.moodmate.support.entity.AppointmentStatus;
import com.moodmate.support.entity.Conversation;
import com.moodmate.support.entity.Counsellor;
import com.moodmate.support.entity.CounsellorAvailabilityStatus;
import com.moodmate.support.entity.CounsellorRating;
import com.moodmate.support.entity.CounsellorStatus;
import com.moodmate.support.entity.MentorRequest;
import com.moodmate.support.entity.MentorRequestStatus;
import com.moodmate.support.entity.PeerMentor;
import com.moodmate.support.entity.PeerMentorStatus;
import com.moodmate.support.entity.SenderType;
import com.moodmate.support.entity.SupportMessage;
import com.moodmate.support.entity.VideoSessionAudit;
import com.moodmate.support.exception.ApiException;
import com.moodmate.support.repository.AppointmentRepository;
import com.moodmate.support.repository.ConversationRepository;
import com.moodmate.support.repository.CounsellorRatingRepository;
import com.moodmate.support.repository.CounsellorRepository;
import com.moodmate.support.repository.MentorRequestRepository;
import com.moodmate.support.repository.PeerMentorRepository;
import com.moodmate.support.repository.SupportMessageRepository;
import com.moodmate.support.repository.VideoSessionAuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Ported from the monolith's support.SupportService. Two changes of substance versus the
 * monolith: (1) AuthService (in-process) is replaced by AuthServiceClient (HTTP call to
 * auth-service); (2) approveCounsellorRequest no longer publishes an in-process
 * CounsellorApprovedEvent - it calls authServiceClient.promoteToCounsellor(...) directly instead,
 * since there's no shared Spring ApplicationContext to listen on anymore. */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupportService {

    private final CounsellorRepository counsellorRepository;
    private final PeerMentorRepository peerMentorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConversationRepository conversationRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final CounsellorRatingRepository counsellorRatingRepository;
    private final VideoSessionAuditRepository videoSessionAuditRepository;
    private final EscalationCaseRepository escalationCaseRepository;
    private final AuthServiceClient authServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    // Peer Mentor Platform (Milestone 5) - notification-type wiring fix.
    private final NotificationsServiceClient notificationsServiceClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<CounsellorDto> listCounsellors() {
        return counsellorRepository.findByStatusAndAvailableTrueOrderBySortOrder(CounsellorStatus.APPROVED)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public CounsellorRequestResponse requestCounsellorStatus(Long userId, CounsellorRequestInput request) {
        if (counsellorRepository.findByUserId(userId).isPresent()) {
            throw new ApiException("You already have a counsellor request on file", HttpStatus.CONFLICT);
        }

        UserSummary requester = authServiceClient.getUserSummary(userId);

        Counsellor counsellor = Counsellor.builder()
                .userId(userId)
                .name(requester.fullName())
                .avatarEmoji(requester.avatarEmoji())
                .title(request.title())
                .bio(request.bio())
                .specialties(request.specialties())
                .available(false)
                .sortOrder(0)
                .status(CounsellorStatus.PENDING)
                .build();

        counsellor = counsellorRepository.save(counsellor);
        return new CounsellorRequestResponse(counsellor.getId(), counsellor.getStatus());
    }

    @Transactional(readOnly = true)
    public List<CounsellorRequestAdminView> listPendingCounsellorRequests() {
        return counsellorRepository.findByStatus(CounsellorStatus.PENDING).stream().map(this::toAdminView).toList();
    }

    @Transactional
    public CounsellorRequestAdminView approveCounsellorRequest(Long counsellorId) {
        Counsellor counsellor = findPendingRequest(counsellorId);
        // Idempotent: if already APPROVED (e.g. admin clicks Approve from full roster on an
        // already-approved row, or the approval is re-sent), skip the state change and role
        // promotion - but still return the current view so the frontend updates cleanly.
        if (counsellor.getStatus() == CounsellorStatus.APPROVED) {
            return toAdminView(counsellor);
        }
        counsellor.setStatus(CounsellorStatus.APPROVED);
        counsellor.setAvailable(true);
        counsellor = counsellorRepository.save(counsellor);

        // Null-guarded to mirror suspendCounsellor/reinstateCounsellor exactly - a PENDING request
        // created via requestCounsellorStatus always carries a userId today, but this closes the
        // same latent gap those two methods already guard against (a legacy/manually-seeded row
        // with no linked account would otherwise send authServiceClient.promoteToCounsellor(null),
        // which auth-service can't resolve to a real user and would fail the whole approval).
        if (counsellor.getUserId() != null) {
            // Replaces the monolith's eventPublisher.publishEvent(new CounsellorApprovedEvent(...)),
            // handled in-process by auth's CounsellorRoleGrantor. That listener can't exist across a
            // service boundary, so this calls auth-service directly instead - see AuthServiceClient.
            authServiceClient.promoteToCounsellor(counsellor.getUserId());

            // Counsellor/Peer Mentor account-status gating fix - the applicant previously had no way
            // of knowing they'd been approved short of periodically re-logging-in to check; now they're
            // told directly, and to log out/back in so their JWT picks up the new COUNSELLOR role.
            notificationsServiceClient.notify(counsellor.getUserId(), "COUNSELLOR_APPROVED", "You're approved as a counsellor!",
                    "Log out and back in to access your counsellor dashboard.", "Home", null);
        }

        return toAdminView(counsellor);
    }

    @Transactional
    public CounsellorRequestAdminView rejectCounsellorRequest(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor request not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (counsellor.getStatus() != CounsellorStatus.PENDING) {
            throw new ApiException("Only a PENDING application can be rejected (current status: " + counsellor.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        counsellor.setStatus(CounsellorStatus.REJECTED);
        counsellor = counsellorRepository.save(counsellor);

        notificationsServiceClient.notify(counsellor.getUserId(), "COUNSELLOR_REJECTED", "Counsellor application update",
                "Your counsellor application wasn't approved this time.", "Home", null);

        return toAdminView(counsellor);
    }

    private Counsellor findPendingRequest(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor request not found: " + counsellorId, HttpStatus.NOT_FOUND));
        // Relaxed guard: only REJECTED rows are truly non-actionable from the admin approve path.
        // An APPROVED row being re-approved is idempotent (no-op is safe; we just return it as-is
        // below). A SUSPENDED row being approved is the "reinstate from full roster" path - that
        // should use reinstateCounsellor, but we tolerate it here to avoid BAD_REQUEST for admins
        // acting on the full roster view rather than the pending queue.
        if (counsellor.getStatus() == CounsellorStatus.REJECTED) {
            throw new ApiException("A rejected counsellor application cannot be re-approved. Create a new application instead.", HttpStatus.BAD_REQUEST);
        }
        return counsellor;
    }

    // ── Phase 1H (Admin Portal - Counsellor Management) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CounsellorRequestAdminView> listAllCounsellorsForAdmin() {
        return counsellorRepository.findAllByOrderByNameAsc().stream().map(this::toAdminView).toList();
    }

    @Transactional
    public CounsellorRequestAdminView suspendCounsellor(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (counsellor.getStatus() != CounsellorStatus.APPROVED) {
            throw new ApiException("Only an approved counsellor can be suspended", HttpStatus.BAD_REQUEST);
        }
        counsellor.setStatus(CounsellorStatus.SUSPENDED);
        counsellor = counsellorRepository.save(counsellor);

        // Account-status gating fix - this used to only flip the roster row's own status, leaving
        // the underlying account's Role at COUNSELLOR and its existing JWT/session with full
        // CounsellorTabs access despite the suspension. See AuthServiceClient.demoteToStudent's
        // doc comment for the full rationale. Legacy roster rows with no linked account
        // (getUserId() == null) have nothing to demote or notify.
        if (counsellor.getUserId() != null) {
            authServiceClient.demoteToStudent(counsellor.getUserId());
            notificationsServiceClient.notify(counsellor.getUserId(), "COUNSELLOR_SUSPENDED", "Counsellor account suspended",
                    "Your counsellor access has been suspended by an admin.", "Home", null);
        }

        return toAdminView(counsellor);
    }

    @Transactional
    public CounsellorRequestAdminView reinstateCounsellor(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (counsellor.getStatus() != CounsellorStatus.SUSPENDED) {
            throw new ApiException("Only a suspended counsellor can be reinstated", HttpStatus.BAD_REQUEST);
        }
        counsellor.setStatus(CounsellorStatus.APPROVED);
        counsellor = counsellorRepository.save(counsellor);

        // Mirrors suspendCounsellor's demote above - re-grants the COUNSELLOR role that suspension
        // took away.
        if (counsellor.getUserId() != null) {
            authServiceClient.promoteToCounsellor(counsellor.getUserId());
            notificationsServiceClient.notify(counsellor.getUserId(), "COUNSELLOR_REINSTATED", "Counsellor account reinstated",
                    "Log out and back in to regain access to your counsellor dashboard.", "Home", null);
        }

        return toAdminView(counsellor);
    }

    @Transactional
    public CounsellorRequestAdminView adminEditCounsellor(Long counsellorId, AdminEditCounsellorRequest request) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (request.title() != null) counsellor.setTitle(request.title());
        if (request.bio() != null) counsellor.setBio(request.bio());
        if (request.specialties() != null) counsellor.setSpecialties(request.specialties());
        if (request.sortOrder() != null) counsellor.setSortOrder(request.sortOrder());
        return toAdminView(counsellorRepository.save(counsellor));
    }

    // ── Phase 1H (Admin Portal - Peer Mentor Management) ────────────────────────────────────────
    // "Manage" for an already-APPROVED mentor still means listing the roster and toggling
    // available on/off (deactivate keeps the row and any linked account intact, just hides it from
    // the public roster - same effect suspendCounsellor has via status). The approve/reject queue
    // for PENDING applications is the block below this one - see applyAsPeerMentor's doc comment
    // for why this replaced the old admin-linked-only design (Fix #4).

    @Transactional(readOnly = true)
    public List<PeerMentorAdminView> listAllPeerMentorsForAdmin() {
        return peerMentorRepository.findAllByOrderByNameAsc().stream().map(this::toPeerMentorAdminView).toList();
    }

    @Transactional
    public PeerMentorAdminView setPeerMentorActive(Long mentorId, boolean active) {
        PeerMentor mentor = peerMentorRepository.findById(mentorId)
                .orElseThrow(() -> new ApiException("Peer mentor not found: " + mentorId, HttpStatus.NOT_FOUND));
        mentor.setAvailable(active);
        mentor = peerMentorRepository.save(mentor);

        // Account-status gating fix, mirrors suspendCounsellor/reinstateCounsellor exactly - this
        // toggle is the mentor-side equivalent of suspend/reinstate (see this method's own doc
        // comment above), and previously only hid the roster row from the public list while leaving
        // the account's Role at MENTOR with full MentorTabs access. Legacy roster rows with no
        // linked account (getUserId() == null) have nothing to demote/promote or notify.
        if (mentor.getUserId() != null) {
            if (active) {
                authServiceClient.promoteToMentor(mentor.getUserId());
                notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_REACTIVATED", "Peer mentor account reactivated",
                        "Log out and back in to regain access to your peer mentor dashboard.", "Home", null);
            } else {
                authServiceClient.demoteToStudent(mentor.getUserId());
                notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_DEACTIVATED", "Peer mentor account deactivated",
                        "Your peer mentor access has been deactivated by an admin.", "Home", null);
            }
        }

        return toPeerMentorAdminView(mentor);
    }

    private PeerMentorAdminView toPeerMentorAdminView(PeerMentor m) {
        return new PeerMentorAdminView(m.getId(), m.getUserId(), m.getName(), m.getBio(), m.getAvatarEmoji(),
                m.getFocusArea(), m.isAvailable(), m.getStatus());
    }

    // ── Fix #4 (Peer Mentor self-serve application flow) ────────────────────────────────────────
    // Replaces the old admin-linked-only design: this service used to only let an admin link a
    // userId to a pre-seeded roster row (linkMentorAccount, still kept below for that case - e.g.
    // an institution hands MoodMate a pre-vetted mentor list to seed directly), because a real
    // vetting/training pipeline didn't exist and the previous design didn't want to imply one. That
    // framing is dropped here: this is a plain application reviewed by an admin, the same honesty
    // level the counsellor request flow already has (which also doesn't verify credentials, just
    // gives an admin a judgment call) - see requestCounsellorStatus above for the pattern this
    // mirrors field-for-field.

    @Transactional
    public PeerMentorApplicationResponse applyAsPeerMentor(Long userId, PeerMentorApplicationInput request) {
        if (peerMentorRepository.findByUserId(userId).isPresent()) {
            throw new ApiException("You already have a peer mentor application on file", HttpStatus.CONFLICT);
        }

        UserSummary requester = authServiceClient.getUserSummary(userId);

        PeerMentor mentor = PeerMentor.builder()
                .userId(userId)
                .name(requester.fullName())
                .avatarEmoji(requester.avatarEmoji())
                .bio(request.bio())
                .focusArea(request.focusArea())
                .available(false)
                .sortOrder(0)
                .status(PeerMentorStatus.PENDING)
                .build();
        mentor = peerMentorRepository.save(mentor);
        return new PeerMentorApplicationResponse(mentor.getId(), mentor.getStatus());
    }

    /**
     * Self-service auto-approval: called by the peer mentor themselves after completing the
     * academy training + agreeing to T&Cs. Looks up by userId rather than mentorId (since the
     * frontend only has the logged-in userId at this point). Only works for PENDING rows - if
     * already APPROVED it returns the existing row (idempotent); if REJECTED, throws 400.
     *
     * The endpoint that calls this ({@code POST /api/support/mentor-applications/self-approve})
     * only requires a valid JWT (not ADMIN) - the JWT itself is the user's proof of identity, and
     * the PENDING row was created by that same userId when they filed the application.
     */
    @Transactional
    public PeerMentorApplicationResponse selfApprovePeerMentor(Long userId) {
        PeerMentor mentor = peerMentorRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("No peer mentor application on file for this account", HttpStatus.NOT_FOUND));
        if (mentor.getStatus() == PeerMentorStatus.REJECTED) {
            throw new ApiException("Your peer mentor application was rejected and cannot be self-approved.", HttpStatus.BAD_REQUEST);
        }
        if (mentor.getStatus() == PeerMentorStatus.APPROVED) {
            // Already done - idempotent return
            return new PeerMentorApplicationResponse(mentor.getId(), mentor.getStatus());
        }
        mentor.setStatus(PeerMentorStatus.APPROVED);
        mentor.setAvailable(true);
        mentor = peerMentorRepository.save(mentor);

        if (mentor.getUserId() != null) {
            authServiceClient.promoteToMentor(mentor.getUserId());
            notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_APPROVED", "Welcome, Peer Mentor! 🎓",
                    "Your academy certification is complete. Log out and back in to access your Peer Mentor dashboard.", "Home", null);
        }

        return new PeerMentorApplicationResponse(mentor.getId(), mentor.getStatus());
    }

    @Transactional(readOnly = true)
    public List<PeerMentorAdminView> listPendingPeerMentorApplications() {
        return peerMentorRepository.findByStatus(PeerMentorStatus.PENDING).stream()
                .map(this::toPeerMentorAdminView).toList();
    }

    @Transactional
    public PeerMentorAdminView approvePeerMentorApplication(Long mentorId) {
        PeerMentor mentor = findPendingPeerMentorApplication(mentorId);
        // Idempotent: already APPROVED means the role was already granted. Return as-is so the
        // frontend updates cleanly (same pattern as approveCounsellorRequest above).
        if (mentor.getStatus() == PeerMentorStatus.APPROVED) {
            return toPeerMentorAdminView(mentor);
        }
        mentor.setStatus(PeerMentorStatus.APPROVED);
        mentor.setAvailable(true);
        mentor = peerMentorRepository.save(mentor);

        // Null-guarded to mirror approveCounsellorRequest's same guard - see that method's doc
        // comment for why (a legacy/manually-seeded row with no linked account otherwise sends
        // authServiceClient.promoteToMentor(null), failing the whole approval).
        if (mentor.getUserId() != null) {
            // Mirrors approveCounsellorRequest's authServiceClient.promoteToCounsellor call.
            authServiceClient.promoteToMentor(mentor.getUserId());

            // Account-status gating fix - mirrors approveCounsellorRequest's notify call.
            notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_APPROVED", "You're approved as a peer mentor!",
                    "Log out and back in to access your peer mentor dashboard.", "Home", null);
        }

        return toPeerMentorAdminView(mentor);
    }

    @Transactional
    public PeerMentorAdminView rejectPeerMentorApplication(Long mentorId) {
        PeerMentor mentor = peerMentorRepository.findById(mentorId)
                .orElseThrow(() -> new ApiException("Peer mentor application not found: " + mentorId, HttpStatus.NOT_FOUND));
        if (mentor.getStatus() != PeerMentorStatus.PENDING) {
            throw new ApiException("Only a PENDING application can be rejected (current status: " + mentor.getStatus() + ")", HttpStatus.BAD_REQUEST);
        }
        mentor.setStatus(PeerMentorStatus.REJECTED);
        mentor = peerMentorRepository.save(mentor);

        notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_REJECTED", "Peer mentor application update",
                "Your peer mentor application wasn't approved this time.", "Home", null);

        return toPeerMentorAdminView(mentor);
    }

    private PeerMentor findPendingPeerMentorApplication(Long mentorId) {
        PeerMentor mentor = peerMentorRepository.findById(mentorId)
                .orElseThrow(() -> new ApiException("Peer mentor application not found: " + mentorId, HttpStatus.NOT_FOUND));
        // Relaxed guard: only REJECTED rows are non-actionable from the approve path.
        // APPROVED is idempotent (handled above in approvePeerMentorApplication).
        if (mentor.getStatus() == PeerMentorStatus.REJECTED) {
            throw new ApiException("A rejected peer mentor application cannot be re-approved.", HttpStatus.BAD_REQUEST);
        }
        return mentor;
    }

    @Transactional(readOnly = true)
    public List<PeerMentorDto> listPeerMentors() {
        return peerMentorRepository.findByStatusAndAvailableTrueOrderBySortOrder(PeerMentorStatus.APPROVED)
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<BookedSlotView> listBookedSlots(Long counsellorId, Instant from, Instant to) {
        if (!to.isAfter(from)) {
            throw new ApiException("The availability end time must be after the start time", HttpStatus.BAD_REQUEST);
        }
        counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor not found: " + counsellorId, HttpStatus.NOT_FOUND));

        Instant queryFrom = from.minusSeconds(SESSION_DURATION_MINUTES * 60L);
        return appointmentRepository
                .findByCounsellorIdAndStatusInAndScheduledAtBetweenOrderByScheduledAtAsc(
                        counsellorId,
                        List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                        queryFrom,
                        to)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                .filter(a -> windowsOverlap(a.getScheduledAt(), from, to))
                .map(a -> new BookedSlotView(a.getScheduledAt(), appointmentWindowEndsAt(a.getScheduledAt())))
                .toList();
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long userId, BookAppointmentRequest request) {
        Counsellor counsellor = counsellorRepository.findById(request.counsellorId())
                .orElseThrow(() -> new ApiException("Counsellor not found: " + request.counsellorId(), HttpStatus.NOT_FOUND));

        // Counsellor Platform (Milestone 4) - double-booking prevention.
        assertNoOverlap(counsellor.getId(), request.scheduledAt(), null);

        // Premium gating breadth (Milestone item 7) - "priority" is set once, at booking time, from
        // whether the student is Pro right now. See Appointment.priority's doc comment.
        Appointment appointment = Appointment.builder()
                .userId(userId)
                .counsellorId(counsellor.getId())
                .scheduledAt(request.scheduledAt())
                .status(AppointmentStatus.PENDING)
                .notes(request.notes())
                .jitsiRoomName(generateJitsiRoomName())
                .priority(paymentsServiceClient.isPro(userId))
                .build();

        appointment = appointmentRepository.save(appointment);

        // Feature 9 (Notification Deep Linking) - Appointment Routing.
        notifyCounsellor(counsellor, "New appointment request",
                "A student has requested an appointment with you.",
                Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));

        return toResponse(appointment, counsellor.getName());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointments(Long userId) {
        List<Appointment> appointments = appointmentRepository.findByUserIdOrderByScheduledAtDesc(userId);
        List<Long> counsellorIds = appointments.stream().map(Appointment::getCounsellorId).distinct().toList();
        Map<Long, String> counsellorNames = counsellorIds.isEmpty()
                ? Map.of()
                : counsellorRepository.findAllById(counsellorIds).stream()
                        .collect(Collectors.toMap(Counsellor::getId, Counsellor::getName));

        return appointments.stream()
                .map(a -> toResponse(a, counsellorNames.getOrDefault(a.getCounsellorId(), "Counsellor")))
                .toList();
    }

    /** Phase 1F-A - student-initiated reschedule. Only a PENDING or CONFIRMED appointment can be
     * rescheduled (a COMPLETED/CANCELLED one is final). A CONFIRMED appointment reschedules back
     * to PENDING rather than staying CONFIRMED at the new time - the counsellor confirmed a
     * specific slot, not "whatever time the student picks next," so a fresh confirmation is
     * required at the new time too, same as an initial booking. This keeps the state machine to
     * exactly the transitions confirmAppointment() already understands, rather than adding a
     * separate "confirmed but at a pending-reschedule" state. */
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long userId, Long appointmentId, Instant newScheduledAt) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));

        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ApiException("Cannot reschedule an appointment that is " + appointment.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // Counsellor Platform (Milestone 4) - double-booking prevention applies to reschedules too.
        assertNoOverlap(appointment.getCounsellorId(), newScheduledAt, appointment.getId());

        boolean neededReconfirmation = appointment.getStatus() == AppointmentStatus.CONFIRMED;
        appointment.setScheduledAt(newScheduledAt);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment = appointmentRepository.save(appointment);

        Counsellor counsellor = counsellorRepository.findById(appointment.getCounsellorId()).orElse(null);
        if (counsellor != null) {
            notifyCounsellor(counsellor,
                    neededReconfirmation ? "Appointment rescheduled - please reconfirm" : "Appointment rescheduled",
                    "A student has requested a new time for their appointment.",
                    Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));
        }
        return toResponse(appointment, counsellor != null ? counsellor.getName() : "Counsellor");
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ApiException("Cannot cancel an appointment that is already " + appointment.getStatus(), HttpStatus.BAD_REQUEST);
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);

        Counsellor counsellor = counsellorRepository.findById(appointment.getCounsellorId()).orElse(null);
        // Feature 9 (Notification Deep Linking) - Appointment Routing (student cancels -> notify counsellor).
        if (counsellor != null) {
            notifyCounsellor(counsellor, "Appointment cancelled",
                    "A student has cancelled their appointment with you.",
                    Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));
        }
        return toResponse(appointment, counsellor != null ? counsellor.getName() : "Counsellor");
    }

    @Transactional(readOnly = true)
    public List<CounsellorAppointmentView> listCounsellorAppointments(Long counsellorUserId) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        // Premium gating breadth (Milestone item 7) - priority requests surface first regardless
        // of status, matching the repository method's doc comment.
        List<Appointment> appointments = appointmentRepository.findByCounsellorIdOrderByPriorityDescScheduledAtDesc(counsellor.getId());
        Map<Long, UserSummary> students = authServiceClient.getUserSummaries(
                appointments.stream().map(Appointment::getUserId).distinct().toList());
        return appointments.stream().map(a -> toCounsellorView(a, students)).toList();
    }

    @Transactional
    public CounsellorAppointmentView confirmAppointment(Long counsellorUserId, Long appointmentId) {
        Appointment appointment = findOwnedAppointment(counsellorUserId, appointmentId);
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new ApiException("Only a pending appointment can be confirmed", HttpStatus.BAD_REQUEST);
        }
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        // Feature 9 (Notification Deep Linking) - Appointment Routing.
        authServiceClient.notify(appointment.getUserId(), "Appointment confirmed",
                "Your counsellor confirmed your appointment.",
                Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));

        return toCounsellorView(appointment, authServiceClient.getUserSummaries(List.of(appointment.getUserId())));
    }

    @Transactional
    public CounsellorAppointmentView completeAppointment(Long counsellorUserId, Long appointmentId) {
        Appointment appointment = findOwnedAppointment(counsellorUserId, appointmentId);
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ApiException("Only a confirmed appointment can be marked completed", HttpStatus.BAD_REQUEST);
        }
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);

        // Feature 9 (Notification Deep Linking) - Appointment Routing.
        authServiceClient.notify(appointment.getUserId(), "Appointment completed",
                "Your appointment has been marked as completed.",
                Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));

        return toCounsellorView(appointment, authServiceClient.getUserSummaries(List.of(appointment.getUserId())));
    }

    @Transactional
    public CounsellorAppointmentView cancelAppointmentAsCounsellor(Long counsellorUserId, Long appointmentId) {
        Appointment appointment = findOwnedAppointment(counsellorUserId, appointmentId);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ApiException("Cannot cancel an appointment that is already " + appointment.getStatus(), HttpStatus.BAD_REQUEST);
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);

        // Feature 9 (Notification Deep Linking) - Appointment Routing.
        authServiceClient.notify(appointment.getUserId(), "Appointment cancelled",
                "Your counsellor cancelled your appointment.",
                Map.of("screen", "Appointments", "appointmentId", appointment.getId().toString()));

        return toCounsellorView(appointment, authServiceClient.getUserSummaries(List.of(appointment.getUserId())));
    }

    // ── Phase 1F-B - Jitsi (8x8 JaaS) meeting credentials ───────────────────────────────────────
    // A session is assumed to run SESSION_DURATION_MINUTES from its scheduledAt. The join window
    // opens JOIN_WINDOW_BEFORE_MINUTES early and stays open until SESSION_DURATION_MINUTES +
    // JOIN_WINDOW_GRACE_MINUTES after scheduledAt, so a session running slightly long isn't cut off
    // the instant the nominal duration elapses. Neither participant ever gets the real room path
    // outside this window or before the appointment is CONFIRMED. Using 8x8's JaaS domain (8x8.vc)
    // scoped under our own AppID rather than the fully public meet.jit.si - but no real JaaS API
    // key/JWT signing is configured yet (deliberate scope decision, see tracker), so this is still
    // an unauthenticated join once the room path is known: withholding that path IS the access
    // control for now, same model as a plain meet.jit.si room, just under our own AppID namespace.
    // Revisit once a real JaaS API key exists - the join response shape (open/roomName/joinUrl)
    // already leaves room for a `jwt` field to be added later without a breaking change.

    private static final String JAAS_APP_ID = "vpaas-magic-cookie-b9599a59473b4325900ea2c6ad3ea273";
    private static final int JOIN_WINDOW_BEFORE_MINUTES = 15;
    private static final int SESSION_DURATION_MINUTES = 50;
    private static final int JOIN_WINDOW_GRACE_MINUTES = 10;

    /** Counsellor Platform (Milestone 4) - double-booking prevention. Reuses the same
     * SESSION_DURATION_MINUTES window the Jitsi join-window logic below already assumes, so "does
     * this overlap" means the same thing here as it does for meeting access. Only PENDING/CONFIRMED
     * appointments block a new slot - a CANCELLED or COMPLETED one no longer occupies the
     * counsellor's calendar. excludeAppointmentId lets rescheduleAppointment re-check without
     * always colliding with itself. */
    private void assertNoOverlap(Long counsellorId, Instant scheduledAt, Long excludeAppointmentId) {
        Instant newStart = scheduledAt;
        Instant newEnd = appointmentWindowEndsAt(scheduledAt);
        boolean overlaps = appointmentRepository.findByCounsellorIdOrderByScheduledAtDesc(counsellorId).stream()
                .filter(a -> excludeAppointmentId == null || !a.getId().equals(excludeAppointmentId))
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                .anyMatch(a -> newStart.isBefore(appointmentWindowEndsAt(a.getScheduledAt())) && a.getScheduledAt().isBefore(newEnd));
        if (overlaps) {
            throw new ApiException("This counsellor already has an appointment around that time. Please choose a different slot.",
                    HttpStatus.CONFLICT);
        }
    }

    private boolean windowsOverlap(Instant existingStart, Instant from, Instant to) {
        return existingStart.isBefore(to) && appointmentWindowEndsAt(existingStart).isAfter(from);
    }

    private Instant appointmentWindowEndsAt(Instant scheduledAt) {
        return scheduledAt.plusSeconds(SESSION_DURATION_MINUTES * 60L);
    }

    @Transactional(readOnly = true)
    public MeetingWindowView getStudentMeetingWindow(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));
        MeetingWindowView result = buildMeetingWindow(appointment, userId, "STUDENT");
        return result;
    }

    @Transactional(readOnly = true)
    public MeetingWindowView getCounsellorMeetingWindow(Long counsellorUserId, Long appointmentId) {
        Appointment appointment = findOwnedAppointment(counsellorUserId, appointmentId);
        MeetingWindowView result = buildMeetingWindow(appointment, counsellorUserId, "COUNSELLOR");
        return result;
    }

    private MeetingWindowView buildMeetingWindow(Appointment appointment, Long userId, String role) {
        Instant opensAt = appointment.getScheduledAt().minusSeconds(JOIN_WINDOW_BEFORE_MINUTES * 60L);
        Instant closesAt = appointment.getScheduledAt()
                .plusSeconds((SESSION_DURATION_MINUTES + JOIN_WINDOW_GRACE_MINUTES) * 60L);
        Instant now = Instant.now();

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            // Phase 1F-B audit log - record denied access for non-confirmed appointments
            videoSessionAuditRepository.save(
                    VideoSessionAudit.denied(appointment.getId(), userId, role, "NOT_CONFIRMED"));
            return MeetingWindowView.closed("NOT_CONFIRMED",
                    "This appointment isn't confirmed yet.", opensAt, closesAt);
        }
        if (now.isBefore(opensAt)) {
            // Phase 1F-B audit log - TOO_EARLY denials are high-frequency (polling) so only log at
            // trace level; don't write a row for every 20s poll or the table fills with noise.
            log.trace("Video join denied TOO_EARLY: appointmentId={} userId={}", appointment.getId(), userId);
            return MeetingWindowView.closed("TOO_EARLY",
                    "The session hasn't opened yet.", opensAt, closesAt);
        }
        if (now.isAfter(closesAt)) {
            videoSessionAuditRepository.save(
                    VideoSessionAudit.denied(appointment.getId(), userId, role, "EXPIRED"));
            return MeetingWindowView.closed("EXPIRED",
                    "This session's join window has closed.", opensAt, closesAt);
        }

        // Defensive backfill - only reachable for appointments booked before this column existed.
        if (appointment.getJitsiRoomName() == null) {
            appointment.setJitsiRoomName(generateJitsiRoomName());
            appointment = appointmentRepository.save(appointment);
        }

        // Phase 1F-B audit log - record successful join grant (credentials returned)
        videoSessionAuditRepository.save(VideoSessionAudit.granted(appointment.getId(), userId, role));

        // roomName is the full JaaS path (AppID + room) - this exact string is what the frontend's
        // JitsiMeetExternalAPI config expects for `roomName`, per 8x8's own embed snippet.
        String fullRoomName = JAAS_APP_ID + "/" + appointment.getJitsiRoomName();
        String joinUrl = "https://8x8.vc/" + fullRoomName;
        return MeetingWindowView.open(fullRoomName, joinUrl, opensAt, closesAt);
    }

    private String generateJitsiRoomName() {
        return "MoodMate-" + java.util.UUID.randomUUID().toString().replace("-", "");
    }

    /** Feature 9 (Notification Deep Linking) helper - a Counsellor row's userId is nullable (legacy
     * seeded roster entries that pre-date self-serve account linkage, per Counsellor's own doc
     * comment), so this is a no-op, not an error, for a counsellor with no linked account to push
     * to. */
    private void notifyCounsellor(Counsellor counsellor, String title, String body, Map<String, String> data) {
        if (counsellor.getUserId() == null) {
            log.debug("Skipping notification for counsellor {} - no linked user account", counsellor.getId());
            return;
        }
        authServiceClient.notify(counsellor.getUserId(), title, body, data);
    }

    // Peer Mentor Platform (Milestone 5) - notification-type wiring fix. This is now this
    // service's first producer into moodmate-notifications' real pipeline (Notification row +
    // NotificationType.MENTOR_REQUEST + push-preference/quiet-hours gating), replacing the old
    // direct-Expo-push-only call that never created an in-app Notification Center entry and never
    // respected the user's notification preferences. This is the only notifyMentor call site, so
    // the type is hardcoded here rather than threading a `type` param through a method used from
    // just one place - notifyCounsellor (appointments) is unchanged, out of scope for this fix.
    private void notifyMentor(PeerMentor mentor, String title, String body, Map<String, String> data) {
        if (mentor.getUserId() == null) {
            log.debug("Skipping notification for mentor {} - no linked user account", mentor.getId());
            return;
        }
        notificationsServiceClient.notify(mentor.getUserId(), "MENTOR_REQUEST", title, body,
                data.get("screen"), paramsJson(data));
    }

    // Peer Mentor Platform (Milestone 5) - builds destinationParams JSON from a notify() data map,
    // excluding "screen" (that becomes destinationScreen instead, matching moodmate-notifications'
    // CreateNotificationRequest shape). Returns null (not "{}"), consistent with
    // destinationParams being nullable everywhere else, when there's nothing left to encode.
    private String paramsJson(Map<String, String> data) {
        Map<String, String> params = data.entrySet().stream()
                .filter(e -> !"screen".equals(e.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        if (params.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize notification params: {}", e.getMessage());
            return null;
        }
    }

    // ── Phase 1G - Peer Mentor request/accept workflow ──────────────────────────────────────────

    /** Admin-only account linkage for a pre-seeded roster row - see PeerMentor.userId's doc
     * comment. Kept alongside the self-serve applyAsPeerMentor flow above (Fix #4) for the case
     * where an admin wants to seed a mentor roster row directly (e.g. an institution hands MoodMate
     * a pre-vetted list) rather than having that person go through the in-app application. */
    @Transactional
    public PeerMentorDto linkMentorAccount(Long mentorId, Long userId) {
        PeerMentor mentor = peerMentorRepository.findById(mentorId)
                .orElseThrow(() -> new ApiException("Peer mentor not found: " + mentorId, HttpStatus.NOT_FOUND));
        if (mentor.getUserId() != null) {
            throw new ApiException("This mentor roster entry is already linked to an account", HttpStatus.CONFLICT);
        }
        mentor.setUserId(userId);
        mentor = peerMentorRepository.save(mentor);
        authServiceClient.promoteToMentor(userId);
        return toDto(mentor);
    }

    @Transactional
    public MentorRequestResponse requestMentor(Long userId, RequestMentorRequest request) {
        PeerMentor mentor = peerMentorRepository.findById(request.peerMentorId())
                .orElseThrow(() -> new ApiException("Peer mentor not found: " + request.peerMentorId(), HttpStatus.NOT_FOUND));
        if (mentorRequestRepository.existsByUserIdAndPeerMentorIdAndStatus(userId, mentor.getId(), MentorRequestStatus.PENDING)) {
            throw new ApiException("You already have a pending request with this mentor", HttpStatus.CONFLICT);
        }

        MentorRequest mentorRequest = MentorRequest.builder()
                .userId(userId)
                .peerMentorId(mentor.getId())
                .status(MentorRequestStatus.PENDING)
                .message(request.message())
                .build();
        mentorRequest = mentorRequestRepository.save(mentorRequest);

        notifyMentor(mentor, "New mentor request",
                "A student would like to connect with you.",
                Map.of("screen", "PeerMentorDashboard", "requestId", mentorRequest.getId().toString()));

        return toMentorRequestResponse(mentorRequest, mentor.getName(), null);
    }

    @Transactional(readOnly = true)
    public List<MentorRequestResponse> listMyMentorRequests(Long userId) {
        List<MentorRequest> requests = mentorRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Long> mentorIds = requests.stream().map(MentorRequest::getPeerMentorId).distinct().toList();
        Map<Long, PeerMentor> mentors = mentorIds.isEmpty()
                ? Map.of()
                : peerMentorRepository.findAllById(mentorIds).stream()
                        .collect(Collectors.toMap(PeerMentor::getId, m -> m));

        return requests.stream().map(r -> {
            PeerMentor mentor = mentors.get(r.getPeerMentorId());
            Long conversationId = r.getStatus() == MentorRequestStatus.ACCEPTED
                    ? conversationRepository.findByUserIdAndPeerMentorId(userId, r.getPeerMentorId())
                            .map(Conversation::getId).orElse(null)
                    : null;
            return toMentorRequestResponse(r, mentor != null ? mentor.getName() : "Mentor", conversationId);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<MentorRequestView> listMentorRequestsForMentor(Long mentorUserId) {
        PeerMentor mentor = findLinkedMentor(mentorUserId);
        List<MentorRequest> requests = mentorRequestRepository.findByPeerMentorIdOrderByCreatedAtDesc(mentor.getId());
        Map<Long, UserSummary> students = authServiceClient.getUserSummaries(
                requests.stream().map(MentorRequest::getUserId).distinct().toList());
        return requests.stream().map(r -> toMentorRequestView(r, students)).toList();
    }

    @Transactional
    public MentorRequestView acceptMentorRequest(Long mentorUserId, Long requestId) {
        PeerMentor mentor = findLinkedMentor(mentorUserId);
        MentorRequest request = findOwnedMentorRequest(mentor, requestId);
        if (request.getStatus() != MentorRequestStatus.PENDING) {
            throw new ApiException("Only a pending request can be accepted", HttpStatus.BAD_REQUEST);
        }
        request.setStatus(MentorRequestStatus.ACCEPTED);
        request.setRespondedAt(Instant.now());
        request = mentorRequestRepository.save(request);

        // Creates the conversation right away, same shape as startConversation's mentor branch -
        // the student doesn't have to send a first message to unlock it themselves. studentUserId
        // is captured in its own final variable for the lambda below - `request` itself is
        // reassigned earlier in this method (line above), which makes it non-effectively-final for
        // the rest of the method, not just before that point - javac caught this as a real
        // compilation error ("local variables referenced from a lambda expression must be final or
        // effectively final"), not something the manual review that built this method caught.
        Long studentUserId = request.getUserId();
        conversationRepository.findByUserIdAndPeerMentorId(studentUserId, mentor.getId())
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .userId(studentUserId)
                        .peerMentorId(mentor.getId())
                        .build()));

        // Peer Mentor Platform (Milestone 5) - notification-type wiring fix (see notifyMentor's
        // doc comment for the full rationale).
        notificationsServiceClient.notify(request.getUserId(), "MENTOR_ACCEPTED", "Mentor request accepted",
                mentor.getName() + " accepted your request. You can now message them.",
                "Support", null);

        return toMentorRequestView(request, authServiceClient.getUserSummaries(List.of(request.getUserId())));
    }

    @Transactional
    public MentorRequestView declineMentorRequest(Long mentorUserId, Long requestId) {
        PeerMentor mentor = findLinkedMentor(mentorUserId);
        MentorRequest request = findOwnedMentorRequest(mentor, requestId);
        if (request.getStatus() != MentorRequestStatus.PENDING) {
            throw new ApiException("Only a pending request can be declined", HttpStatus.BAD_REQUEST);
        }
        request.setStatus(MentorRequestStatus.DECLINED);
        request.setRespondedAt(Instant.now());
        request = mentorRequestRepository.save(request);

        // Peer Mentor Platform (Milestone 5) - notification-type wiring fix (see notifyMentor's
        // doc comment for the full rationale).
        notificationsServiceClient.notify(request.getUserId(), "MENTOR_DECLINED", "Mentor request declined",
                mentor.getName() + " isn't able to take on new requests right now.",
                "Support", null);

        return toMentorRequestView(request, authServiceClient.getUserSummaries(List.of(request.getUserId())));
    }

    // ── Phase 1G - mentor-side conversations/messages, mirroring the counsellor equivalents ────

    @Transactional(readOnly = true)
    public List<CounsellorConversationView> listMentorConversations(Long mentorUserId) {
        PeerMentor mentor = findLinkedMentor(mentorUserId);
        List<Conversation> conversations = conversationRepository.findByPeerMentorIdOrderByCreatedAtDesc(mentor.getId());
        Map<Long, UserSummary> students = authServiceClient.getUserSummaries(
                conversations.stream().map(Conversation::getUserId).distinct().toList());
        return conversations.stream().map(c -> toMentorConversationView(c, students)).toList();
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> listMentorMessages(Long mentorUserId, Long conversationId, Pageable pageable) {
        Conversation conversation = findOwnedConversationForMentor(mentorUserId, conversationId);
        return supportMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), pageable)
                .map(this::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendMentorMessage(Long mentorUserId, Long conversationId, SendMessageRequest request) {
        Conversation conversation = findOwnedConversationForMentor(mentorUserId, conversationId);

        SupportMessage message = SupportMessage.builder()
                .conversationId(conversation.getId())
                .senderType(SenderType.PEER_MENTOR)
                .body(request.body())
                .build();

        MessageResponse response = toMessageResponse(supportMessageRepository.save(message));

        authServiceClient.notify(conversation.getUserId(), "New message",
                "You have a new message from your mentor.",
                Map.of("screen", "Chat", "conversationId", conversation.getId().toString()));

        return response;
    }

    @Transactional
    public void markReadAsMentor(Long mentorUserId, Long conversationId) {
        Conversation conversation = findOwnedConversationForMentor(mentorUserId, conversationId);
        List<SupportMessage> unread = supportMessageRepository
                .findByConversationIdAndSenderTypeNotAndReadAtIsNull(conversation.getId(), SenderType.PEER_MENTOR);
        Instant now = Instant.now();
        unread.forEach(m -> m.setReadAt(now));
        supportMessageRepository.saveAll(unread);
    }

    private PeerMentor findLinkedMentor(Long userId) {
        return peerMentorRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("No peer mentor profile linked to this account", HttpStatus.NOT_FOUND));
    }

    private MentorRequest findOwnedMentorRequest(PeerMentor mentor, Long requestId) {
        return mentorRequestRepository.findByIdAndPeerMentorId(requestId, mentor.getId())
                .orElseThrow(() -> new ApiException("Mentor request not found: " + requestId, HttpStatus.NOT_FOUND));
    }

    private Conversation findOwnedConversationForMentor(Long mentorUserId, Long conversationId) {
        PeerMentor mentor = findLinkedMentor(mentorUserId);
        return conversationRepository.findByIdAndPeerMentorId(conversationId, mentor.getId())
                .orElseThrow(() -> new ApiException("Conversation not found: " + conversationId, HttpStatus.NOT_FOUND));
    }

    private MentorRequestResponse toMentorRequestResponse(MentorRequest r, String mentorName, Long conversationId) {
        return new MentorRequestResponse(r.getId(), r.getPeerMentorId(), mentorName, r.getStatus(), r.getMessage(),
                conversationId, r.getCreatedAt(), r.getRespondedAt());
    }

    private MentorRequestView toMentorRequestView(MentorRequest r, Map<Long, UserSummary> students) {
        UserSummary student = students.get(r.getUserId());
        return new MentorRequestView(r.getId(), r.getUserId(), student != null ? student.fullName() : "Student",
                r.getStatus(), r.getMessage(), r.getCreatedAt(), r.getRespondedAt());
    }

    /** Phase 1F-A - the counsellor dashboard's Online/Busy/Away toggle, now persisted (was
     * previously local-only React state - see CounsellorAvailabilityStatus's doc comment). */
    @Transactional
    public CounsellorAvailabilityStatus updateAvailabilityStatus(Long counsellorUserId, CounsellorAvailabilityStatus newStatus) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        counsellor.setAvailabilityStatus(newStatus);
        counsellorRepository.save(counsellor);
        return newStatus;
    }

    // Counsellor Platform (Milestone 4) - "get my own status" endpoint, mirrors
    // updateAvailabilityStatus's own lookup pattern exactly.
    @Transactional(readOnly = true)
    public CounsellorAvailabilityStatus getMyAvailabilityStatus(Long counsellorUserId) {
        return findLinkedCounsellor(counsellorUserId).getAvailabilityStatus();
    }

    /**
     * Phase 1F-A - backs GET /api/support/counsellor/analytics. Lifetime counts, computed from
     * this counsellor's full appointment history rather than a separate aggregate table - the
     * dataset per counsellor is small enough that this is simple and always correct, no cache to
     * go stale.
     *
     * Bucket definitions (the only ones that aren't obvious from AppointmentStatus alone):
     * - upcoming: PENDING or CONFIRMED, scheduledAt still in the future.
     * - missed: CONFIRMED, but scheduledAt has already passed and it was never marked COMPLETED -
     *   nothing in this system auto-transitions status on time passing, so this is computed here
     *   rather than read off a stored value.
     * - completionRate: completed / (completed + missed). Cancelled and still-upcoming
     *   appointments are excluded from the denominator - they were never "attempted," so folding
     *   them in would understate a counsellor's actual completion behavior.
     */
    @Transactional(readOnly = true)
    public CounsellorAnalyticsResponse counsellorAnalytics(Long counsellorUserId) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        List<Appointment> appointments = appointmentRepository.findByCounsellorIdOrderByScheduledAtDesc(counsellor.getId());
        Instant now = Instant.now();

        long total = appointments.size();
        long completed = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long cancelled = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        long upcoming = appointments.stream()
                .filter(a -> (a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                        && a.getScheduledAt().isAfter(now))
                .count();
        long missed = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED && a.getScheduledAt().isBefore(now))
                .count();

        double completionRate = (completed + missed) > 0 ? (double) completed / (completed + missed) : 0.0;

        return new CounsellorAnalyticsResponse(total, upcoming, completed, missed, cancelled, completionRate);
    }

    private Counsellor findLinkedCounsellor(Long userId) {
        return counsellorRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("No counsellor profile linked to this account", HttpStatus.NOT_FOUND));
    }

    private Appointment findOwnedAppointment(Long counsellorUserId, Long appointmentId) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        return appointmentRepository.findByIdAndCounsellorId(appointmentId, counsellor.getId())
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ConversationResponse startConversation(Long userId, StartConversationRequest request) {
        boolean hasCounsellor = request.counsellorId() != null;
        boolean hasMentor = request.peerMentorId() != null;
        if (hasCounsellor == hasMentor) {
            throw new ApiException("Provide exactly one of counsellorId or peerMentorId", HttpStatus.BAD_REQUEST);
        }

        Conversation conversation;
        if (hasCounsellor) {
            Counsellor counsellor = counsellorRepository.findById(request.counsellorId())
                    .orElseThrow(() -> new ApiException("Counsellor not found: " + request.counsellorId(), HttpStatus.NOT_FOUND));
            conversation = conversationRepository.findByUserIdAndCounsellorId(userId, counsellor.getId())
                    .orElseGet(() -> conversationRepository.save(Conversation.builder()
                            .userId(userId)
                            .counsellorId(counsellor.getId())
                            .build()));
        } else {
            PeerMentor mentor = peerMentorRepository.findById(request.peerMentorId())
                    .orElseThrow(() -> new ApiException("Peer mentor not found: " + request.peerMentorId(), HttpStatus.NOT_FOUND));
            // Phase 1G - messaging a mentor now requires an ACCEPTED mentor request first (see
            // requestMentor/acceptMentorRequest below). acceptMentorRequest already creates this
            // conversation directly, so in practice this orElseGet rarely fires for mentors - this
            // check is defense in depth for any direct caller of this endpoint, not the primary path.
            boolean accepted = mentorRequestRepository.existsByUserIdAndPeerMentorIdAndStatus(
                    userId, mentor.getId(), MentorRequestStatus.ACCEPTED);
            if (!accepted) {
                throw new ApiException("Send a mentor request first - messaging opens once the mentor accepts.",
                        HttpStatus.FORBIDDEN);
            }
            conversation = conversationRepository.findByUserIdAndPeerMentorId(userId, mentor.getId())
                    .orElseGet(() -> conversationRepository.save(Conversation.builder()
                            .userId(userId)
                            .peerMentorId(mentor.getId())
                            .build()));
        }

        return toConversationResponse(conversation);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> listMessages(Long userId, Long conversationId, Pageable pageable) {
        Conversation conversation = findOwnedConversation(userId, conversationId);
        return supportMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), pageable)
                .map(this::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendMessage(Long userId, Long conversationId, SendMessageRequest request) {
        Conversation conversation = findOwnedConversation(userId, conversationId);

        SupportMessage message = SupportMessage.builder()
                .conversationId(conversation.getId())
                .senderType(SenderType.USER)
                .body(request.body())
                .build();

        MessageResponse response = toMessageResponse(supportMessageRepository.save(message));

        // Feature 9 (Notification Deep Linking) - Counsellor Message Routing. Only conversations
        // with a counsellor (not a peer mentor) resolve to a notifiable account here - peer mentor
        // conversations have no linked user account to push to.
        if (conversation.getCounsellorId() != null) {
            counsellorRepository.findById(conversation.getCounsellorId())
                    .ifPresent(c -> notifyCounsellor(c, "New message",
                            "You have a new message from a student.",
                            Map.of("screen", "CounsellorChat", "conversationId", conversation.getId().toString())));
        }

        return response;
    }

    @Transactional
    public void markRead(Long userId, Long conversationId) {
        Conversation conversation = findOwnedConversation(userId, conversationId);
        List<SupportMessage> unread = supportMessageRepository
                .findByConversationIdAndSenderTypeNotAndReadAtIsNull(conversation.getId(), SenderType.USER);
        Instant now = Instant.now();
        unread.forEach(m -> m.setReadAt(now));
        supportMessageRepository.saveAll(unread);
    }

    @Transactional(readOnly = true)
    public List<CounsellorConversationView> listCounsellorConversations(Long counsellorUserId) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        List<Conversation> conversations = conversationRepository.findByCounsellorIdOrderByCreatedAtDesc(counsellor.getId());
        Map<Long, UserSummary> students = authServiceClient.getUserSummaries(
                conversations.stream().map(Conversation::getUserId).distinct().toList());
        return conversations.stream().map(c -> toCounsellorConversationView(c, students)).toList();
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> listCounsellorMessages(Long counsellorUserId, Long conversationId, Pageable pageable) {
        Conversation conversation = findOwnedConversationForCounsellor(counsellorUserId, conversationId);
        return supportMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), pageable)
                .map(this::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendCounsellorMessage(Long counsellorUserId, Long conversationId, SendMessageRequest request) {
        Conversation conversation = findOwnedConversationForCounsellor(counsellorUserId, conversationId);

        SupportMessage message = SupportMessage.builder()
                .conversationId(conversation.getId())
                .senderType(SenderType.COUNSELLOR)
                .body(request.body())
                .build();

        MessageResponse response = toMessageResponse(supportMessageRepository.save(message));

        // Feature 9 (Notification Deep Linking) - Counsellor Message Routing (counsellor -> student).
        authServiceClient.notify(conversation.getUserId(), "New message",
                "You have a new message from your counsellor.",
                Map.of("screen", "Chat", "conversationId", conversation.getId().toString()));

        return response;
    }

    @Transactional
    public void markReadAsCounsellor(Long counsellorUserId, Long conversationId) {
        Conversation conversation = findOwnedConversationForCounsellor(counsellorUserId, conversationId);
        List<SupportMessage> unread = supportMessageRepository
                .findByConversationIdAndSenderTypeNotAndReadAtIsNull(conversation.getId(), SenderType.COUNSELLOR);
        Instant now = Instant.now();
        unread.forEach(m -> m.setReadAt(now));
        supportMessageRepository.saveAll(unread);
    }

    private Conversation findOwnedConversation(Long userId, Long conversationId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ApiException("Conversation not found: " + conversationId, HttpStatus.NOT_FOUND));
    }

    private Conversation findOwnedConversationForCounsellor(Long counsellorUserId, Long conversationId) {
        Counsellor counsellor = findLinkedCounsellor(counsellorUserId);
        return conversationRepository.findByIdAndCounsellorId(conversationId, counsellor.getId())
                .orElseThrow(() -> new ApiException("Conversation not found: " + conversationId, HttpStatus.NOT_FOUND));
    }

    private ConversationResponse toConversationResponse(Conversation conversation) {
        String counsellorName = conversation.getCounsellorId() == null ? null :
                counsellorRepository.findById(conversation.getCounsellorId()).map(Counsellor::getName).orElse(null);
        String mentorName = conversation.getPeerMentorId() == null ? null :
                peerMentorRepository.findById(conversation.getPeerMentorId()).map(PeerMentor::getName).orElse(null);

        String preview = supportMessageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .map(SupportMessage::getBody)
                .orElse(null);
        long unreadCount = supportMessageRepository
                .countByConversationIdAndSenderTypeNotAndReadAtIsNull(conversation.getId(), SenderType.USER);

        return new ConversationResponse(conversation.getId(), conversation.getCounsellorId(), counsellorName,
                conversation.getPeerMentorId(), mentorName, conversation.getCreatedAt(), preview, unreadCount);
    }

    private MessageResponse toMessageResponse(SupportMessage message) {
        return new MessageResponse(message.getId(), message.getConversationId(), message.getSenderType(),
                message.getBody(), message.getCreatedAt(), message.getReadAt());
    }

    private AppointmentResponse toResponse(Appointment appointment, String counsellorName) {
        boolean rated = appointment.getStatus() == AppointmentStatus.COMPLETED
                && counsellorRatingRepository.existsByAppointmentId(appointment.getId());
        return new AppointmentResponse(appointment.getId(), appointment.getCounsellorId(), counsellorName,
                appointment.getScheduledAt(), appointment.getStatus(), appointment.getNotes(), appointment.getCreatedAt(),
                rated, appointment.isPriority());
    }

    // ── Fix #5 (rating/review system) ────────────────────────────────────────────────────────────

    @Transactional
    public CounsellorRatingResponse submitCounsellorRating(Long userId, Long appointmentId, SubmitCounsellorRatingRequest request) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ApiException("Only a completed appointment can be rated", HttpStatus.BAD_REQUEST);
        }
        if (counsellorRatingRepository.existsByAppointmentId(appointmentId)) {
            throw new ApiException("This appointment has already been rated", HttpStatus.CONFLICT);
        }

        CounsellorRating rating = CounsellorRating.builder()
                .appointmentId(appointmentId)
                .counsellorId(appointment.getCounsellorId())
                .studentUserId(userId)
                .stars(request.stars())
                .comment(request.comment())
                .build();
        rating = counsellorRatingRepository.save(rating);
        return new CounsellorRatingResponse(rating.getId(), rating.getAppointmentId(), rating.getStars(),
                rating.getComment(), rating.getCreatedAt());
    }

    private CounsellorAppointmentView toCounsellorView(Appointment a, Map<Long, UserSummary> students) {
        UserSummary student = students.get(a.getUserId());
        return new CounsellorAppointmentView(a.getId(), a.getUserId(), student != null ? student.fullName() : "Student",
                a.getScheduledAt(), a.getStatus(), a.getNotes(), a.getCreatedAt(), a.isPriority());
    }

    private CounsellorConversationView toCounsellorConversationView(Conversation c, Map<Long, UserSummary> students) {
        return toConversationViewForOwner(c, students, SenderType.COUNSELLOR);
    }

    // Phase 1G - mirrors toCounsellorConversationView, parameterized on which SenderType owns the
    // conversation. Reusing the COUNSELLOR-hardcoded version for mentor conversations would have
    // counted the mentor's own sent messages as "unread" (since PEER_MENTOR != COUNSELLOR passes
    // the "not equal" filter too) - caught in manual review since this service's compiler
    // couldn't be run in this session, see the tracker's note on that.
    private CounsellorConversationView toMentorConversationView(Conversation c, Map<Long, UserSummary> students) {
        return toConversationViewForOwner(c, students, SenderType.PEER_MENTOR);
    }

    private CounsellorConversationView toConversationViewForOwner(Conversation c, Map<Long, UserSummary> students, SenderType ownerSenderType) {
        UserSummary student = students.get(c.getUserId());
        String preview = supportMessageRepository.findTopByConversationIdOrderByCreatedAtDesc(c.getId())
                .map(SupportMessage::getBody).orElse(null);
        long unreadCount = supportMessageRepository
                .countByConversationIdAndSenderTypeNotAndReadAtIsNull(c.getId(), ownerSenderType);
        return new CounsellorConversationView(c.getId(), c.getUserId(), student != null ? student.fullName() : "Student",
                c.getCreatedAt(), preview, unreadCount);
    }

    /** Phase 1E, Step 4 - backs GET /internal/support/appointments/confirmed. Every CONFIRMED
     * appointment regardless of date; moodmate-notifications' AppointmentReminderScheduledJob is
     * responsible for the "within the next 24h" window check, not this service. */
    @Transactional(readOnly = true)
    public List<ConfirmedAppointmentResponse> confirmedAppointments() {
        return appointmentRepository.findByStatus(AppointmentStatus.CONFIRMED).stream()
                .map(a -> new ConfirmedAppointmentResponse(a.getId(), a.getUserId(), a.getScheduledAt()))
                .toList();
    }

    private CounsellorDto toDto(Counsellor c) {
        List<String> specialties = c.getSpecialties() == null || c.getSpecialties().isBlank()
                ? List.of()
                : Arrays.stream(c.getSpecialties().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        long ratingCount = counsellorRatingRepository.countByCounsellorId(c.getId());
        Double averageRating = ratingCount == 0 ? null : counsellorRatingRepository.averageStarsByCounsellorId(c.getId());
        return new CounsellorDto(c.getId(), c.getName(), c.getTitle(), c.getBio(), c.getAvatarEmoji(), specialties,
                c.isAvailable(), c.getAvailabilityStatus(), averageRating, ratingCount);
    }

    private PeerMentorDto toDto(PeerMentor m) {
        return new PeerMentorDto(m.getId(), m.getName(), m.getBio(), m.getAvatarEmoji(), m.getFocusArea(),
                m.isAvailable());
    }

    private CounsellorRequestAdminView toAdminView(Counsellor c) {
        return new CounsellorRequestAdminView(c.getId(), c.getUserId(), c.getName(), c.getTitle(), c.getBio(),
                c.getSpecialties(), c.getStatus());
    }

    // ── Collaboration Hub (Mentor ↔ Counsellor escalation) ───────────────────────────────────────

    // MENTOR submits a new escalation
    @Transactional
    public EscalationCaseView submitEscalation(Long mentorUserId, SubmitEscalationRequest request) {
        UserSummary mentor = authServiceClient.getUserSummary(mentorUserId);
        EscalationUrgency urgency = (request.urgency() != null && !request.urgency().isBlank())
                ? EscalationUrgency.valueOf(request.urgency().toUpperCase())
                : EscalationUrgency.PRIORITY;
        EscalationCase saved = escalationCaseRepository.save(
                EscalationCase.builder()
                        .mentorUserId(mentorUserId)
                        .mentorName(mentor.fullName())
                        .studentName(request.studentName())
                        .concern(request.concern())
                        .urgency(urgency)
                        .status(EscalationStatus.SUBMITTED)
                        .build()
        );
        return toEscalationView(saved);
    }

    // MENTOR lists their own cases
    @Transactional(readOnly = true)
    public List<EscalationCaseView> listMyEscalations(Long mentorUserId) {
        return escalationCaseRepository.findByMentorUserIdOrderByCreatedAtDesc(mentorUserId)
                .stream().map(this::toEscalationView).toList();
    }

    // COUNSELLOR lists all cases
    @Transactional(readOnly = true)
    public List<EscalationCaseView> listAllEscalations() {
        return escalationCaseRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toEscalationView).toList();
    }

    // COUNSELLOR marks a case as IN_REVIEW
    @Transactional
    public EscalationCaseView markEscalationInReview(Long counsellorUserId, Long caseId) {
        EscalationCase c = escalationCaseRepository.findById(caseId)
                .orElseThrow(() -> new ApiException("Escalation case not found: " + caseId, HttpStatus.NOT_FOUND));
        UserSummary counsellor = authServiceClient.getUserSummary(counsellorUserId);
        c.setStatus(EscalationStatus.IN_REVIEW);
        c.setReviewerName(counsellor.fullName());
        c = escalationCaseRepository.save(c);
        // Notify the mentor their case is being reviewed
        notificationsServiceClient.notify(c.getMentorUserId(), "SYSTEM",
                "Case under review",
                counsellor.fullName() + " is reviewing your escalation for " + c.getStudentName() + ".",
                "CollaborationHub", null);
        return toEscalationView(c);
    }

    // COUNSELLOR sends feedback on a case
    @Transactional
    public EscalationCaseView sendEscalationFeedback(Long counsellorUserId, Long caseId, EscalationFeedbackRequest request) {
        EscalationCase c = escalationCaseRepository.findById(caseId)
                .orElseThrow(() -> new ApiException("Escalation case not found: " + caseId, HttpStatus.NOT_FOUND));
        UserSummary counsellor = authServiceClient.getUserSummary(counsellorUserId);
        c.setStatus(EscalationStatus.FEEDBACK_READY);
        c.setFeedback(request.feedback());
        c.setReviewerName(counsellor.fullName());
        c.setReviewedAt(Instant.now());
        c = escalationCaseRepository.save(c);
        // Notify the mentor they have feedback waiting
        notificationsServiceClient.notify(c.getMentorUserId(), "SYSTEM",
                "Counsellor feedback ready",
                "New guidance from " + counsellor.fullName() + " for your case: " + c.getStudentName() + ".",
                "CollaborationHub", null);
        return toEscalationView(c);
    }

    // Private mapper
    private EscalationCaseView toEscalationView(EscalationCase c) {
        return new EscalationCaseView(
                c.getId(), c.getMentorUserId(), c.getMentorName(), c.getStudentName(),
                c.getConcern(), c.getUrgency().name(), c.getStatus().name(),
                c.getFeedback(), c.getReviewerName(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null,
                c.getReviewedAt() != null ? c.getReviewedAt().toString() : null
        );
    }
}
