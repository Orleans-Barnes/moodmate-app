package com.moodmate.support.service;

import com.moodmate.support.client.AuthServiceClient;
import com.moodmate.support.client.UserSummary;
import com.moodmate.support.dto.AdminEditCounsellorRequest;
import com.moodmate.support.dto.AppointmentResponse;
import com.moodmate.support.dto.BookAppointmentRequest;
import com.moodmate.support.dto.ConfirmedAppointmentResponse;
import com.moodmate.support.dto.ConversationResponse;
import com.moodmate.support.dto.CounsellorAnalyticsResponse;
import com.moodmate.support.dto.CounsellorAppointmentView;
import com.moodmate.support.dto.CounsellorConversationView;
import com.moodmate.support.dto.CounsellorDto;
import com.moodmate.support.dto.CounsellorRequestAdminView;
import com.moodmate.support.dto.CounsellorRequestInput;
import com.moodmate.support.dto.CounsellorRequestResponse;
import com.moodmate.support.dto.LinkMentorAccountRequest;
import com.moodmate.support.dto.MeetingWindowView;
import com.moodmate.support.dto.MentorRequestResponse;
import com.moodmate.support.dto.MentorRequestView;
import com.moodmate.support.dto.MessageResponse;
import com.moodmate.support.dto.PeerMentorAdminView;
import com.moodmate.support.dto.PeerMentorDto;
import com.moodmate.support.dto.RequestMentorRequest;
import com.moodmate.support.dto.SendMessageRequest;
import com.moodmate.support.dto.StartConversationRequest;
import com.moodmate.support.entity.Appointment;
import com.moodmate.support.entity.AppointmentStatus;
import com.moodmate.support.entity.Conversation;
import com.moodmate.support.entity.Counsellor;
import com.moodmate.support.entity.CounsellorAvailabilityStatus;
import com.moodmate.support.entity.CounsellorStatus;
import com.moodmate.support.entity.MentorRequest;
import com.moodmate.support.entity.MentorRequestStatus;
import com.moodmate.support.entity.PeerMentor;
import com.moodmate.support.entity.SenderType;
import com.moodmate.support.entity.SupportMessage;
import com.moodmate.support.exception.ApiException;
import com.moodmate.support.repository.AppointmentRepository;
import com.moodmate.support.repository.ConversationRepository;
import com.moodmate.support.repository.CounsellorRepository;
import com.moodmate.support.repository.MentorRequestRepository;
import com.moodmate.support.repository.PeerMentorRepository;
import com.moodmate.support.repository.SupportMessageRepository;
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
    private final AuthServiceClient authServiceClient;

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
        counsellor.setStatus(CounsellorStatus.APPROVED);
        counsellor.setAvailable(true);
        counsellor = counsellorRepository.save(counsellor);

        // Replaces the monolith's eventPublisher.publishEvent(new CounsellorApprovedEvent(...)),
        // handled in-process by auth's CounsellorRoleGrantor. That listener can't exist across a
        // service boundary, so this calls auth-service directly instead - see AuthServiceClient.
        authServiceClient.promoteToCounsellor(counsellor.getUserId());

        return toAdminView(counsellor);
    }

    @Transactional
    public CounsellorRequestAdminView rejectCounsellorRequest(Long counsellorId) {
        Counsellor counsellor = findPendingRequest(counsellorId);
        counsellor.setStatus(CounsellorStatus.REJECTED);
        counsellor = counsellorRepository.save(counsellor);
        return toAdminView(counsellor);
    }

    private Counsellor findPendingRequest(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor request not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (counsellor.getStatus() != CounsellorStatus.PENDING) {
            throw new ApiException("This request has already been " + counsellor.getStatus(), HttpStatus.BAD_REQUEST);
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
        return toAdminView(counsellorRepository.save(counsellor));
    }

    @Transactional
    public CounsellorRequestAdminView reinstateCounsellor(Long counsellorId) {
        Counsellor counsellor = counsellorRepository.findById(counsellorId)
                .orElseThrow(() -> new ApiException("Counsellor not found: " + counsellorId, HttpStatus.NOT_FOUND));
        if (counsellor.getStatus() != CounsellorStatus.SUSPENDED) {
            throw new ApiException("Only a suspended counsellor can be reinstated", HttpStatus.BAD_REQUEST);
        }
        counsellor.setStatus(CounsellorStatus.APPROVED);
        return toAdminView(counsellorRepository.save(counsellor));
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
    // No approve/reject queue here - Phase 1G already established that peer mentor accounts are
    // admin-linked, not self-serve-applied-for (see linkMentorAccount's own doc comment). "Manage"
    // for mentors means listing the full roster and toggling available on/off (deactivate keeps
    // the row and any linked account intact, just hides it from the public roster - same effect
    // suspendCounsellor has via status, but PeerMentor has no status enum, only this boolean).

    @Transactional(readOnly = true)
    public List<PeerMentorAdminView> listAllPeerMentorsForAdmin() {
        return peerMentorRepository.findAllByOrderByNameAsc().stream().map(this::toPeerMentorAdminView).toList();
    }

    @Transactional
    public PeerMentorAdminView setPeerMentorActive(Long mentorId, boolean active) {
        PeerMentor mentor = peerMentorRepository.findById(mentorId)
                .orElseThrow(() -> new ApiException("Peer mentor not found: " + mentorId, HttpStatus.NOT_FOUND));
        mentor.setAvailable(active);
        return toPeerMentorAdminView(peerMentorRepository.save(mentor));
    }

    private PeerMentorAdminView toPeerMentorAdminView(PeerMentor m) {
        return new PeerMentorAdminView(m.getId(), m.getUserId(), m.getName(), m.getBio(), m.getAvatarEmoji(),
                m.getFocusArea(), m.isAvailable());
    }

    @Transactional(readOnly = true)
    public List<PeerMentorDto> listPeerMentors() {
        return peerMentorRepository.findByAvailableTrueOrderBySortOrder().stream().map(this::toDto).toList();
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long userId, BookAppointmentRequest request) {
        Counsellor counsellor = counsellorRepository.findById(request.counsellorId())
                .orElseThrow(() -> new ApiException("Counsellor not found: " + request.counsellorId(), HttpStatus.NOT_FOUND));

        Appointment appointment = Appointment.builder()
                .userId(userId)
                .counsellorId(counsellor.getId())
                .scheduledAt(request.scheduledAt())
                .status(AppointmentStatus.PENDING)
                .notes(request.notes())
                .jitsiRoomName(generateJitsiRoomName())
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
        List<Appointment> appointments = appointmentRepository.findByCounsellorIdOrderByScheduledAtDesc(counsellor.getId());
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

    @Transactional(readOnly = true)
    public MeetingWindowView getStudentMeetingWindow(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ApiException("Appointment not found: " + appointmentId, HttpStatus.NOT_FOUND));
        return buildMeetingWindow(appointment);
    }

    @Transactional(readOnly = true)
    public MeetingWindowView getCounsellorMeetingWindow(Long counsellorUserId, Long appointmentId) {
        Appointment appointment = findOwnedAppointment(counsellorUserId, appointmentId);
        return buildMeetingWindow(appointment);
    }

    private MeetingWindowView buildMeetingWindow(Appointment appointment) {
        Instant opensAt = appointment.getScheduledAt().minusSeconds(JOIN_WINDOW_BEFORE_MINUTES * 60L);
        Instant closesAt = appointment.getScheduledAt()
                .plusSeconds((SESSION_DURATION_MINUTES + JOIN_WINDOW_GRACE_MINUTES) * 60L);
        Instant now = Instant.now();

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return MeetingWindowView.closed("NOT_CONFIRMED",
                    "This appointment isn't confirmed yet.", opensAt, closesAt);
        }
        if (now.isBefore(opensAt)) {
            return MeetingWindowView.closed("TOO_EARLY",
                    "The session hasn't opened yet.", opensAt, closesAt);
        }
        if (now.isAfter(closesAt)) {
            return MeetingWindowView.closed("EXPIRED",
                    "This session's join window has closed.", opensAt, closesAt);
        }

        // Defensive backfill - only reachable for appointments booked before this column existed.
        if (appointment.getJitsiRoomName() == null) {
            appointment.setJitsiRoomName(generateJitsiRoomName());
            appointment = appointmentRepository.save(appointment);
        }

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

    // Phase 1G - mirrors notifyCounsellor exactly.
    private void notifyMentor(PeerMentor mentor, String title, String body, Map<String, String> data) {
        if (mentor.getUserId() == null) {
            log.debug("Skipping notification for mentor {} - no linked user account", mentor.getId());
            return;
        }
        authServiceClient.notify(mentor.getUserId(), title, body, data);
    }

    // ── Phase 1G - Peer Mentor request/accept workflow ──────────────────────────────────────────

    /** Admin-only account linkage - see PeerMentor.userId's doc comment. Not a self-serve
     * request/approve flow like counsellors have (no CounsellorRequest equivalent for mentors):
     * peer mentor accounts require offline certification (see PeerMentorSignupScreen.tsx's own
     * doc comment - "complete training programme", "get certified through the MoodMate Peer
     * Mentor Academy" - a real training pipeline that's explicitly out of scope for this phase),
     * so for now an admin manually links a userId to an existing roster row rather than this
     * service fabricating a fake self-serve application flow around a certification process it
     * doesn't actually run. */
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

        authServiceClient.notify(request.getUserId(), "Mentor request accepted",
                mentor.getName() + " accepted your request. You can now message them.",
                Map.of("screen", "Support"));

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

        authServiceClient.notify(request.getUserId(), "Mentor request declined",
                mentor.getName() + " isn't able to take on new requests right now.",
                Map.of("screen", "Support"));

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
        return new AppointmentResponse(appointment.getId(), appointment.getCounsellorId(), counsellorName,
                appointment.getScheduledAt(), appointment.getStatus(), appointment.getNotes(), appointment.getCreatedAt());
    }

    private CounsellorAppointmentView toCounsellorView(Appointment a, Map<Long, UserSummary> students) {
        UserSummary student = students.get(a.getUserId());
        return new CounsellorAppointmentView(a.getId(), a.getUserId(), student != null ? student.fullName() : "Student",
                a.getScheduledAt(), a.getStatus(), a.getNotes(), a.getCreatedAt());
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
        return new CounsellorDto(c.getId(), c.getName(), c.getTitle(), c.getBio(), c.getAvatarEmoji(), specialties,
                c.isAvailable(), c.getAvailabilityStatus());
    }

    private PeerMentorDto toDto(PeerMentor m) {
        return new PeerMentorDto(m.getId(), m.getName(), m.getBio(), m.getAvatarEmoji(), m.getFocusArea(),
                m.isAvailable());
    }

    private CounsellorRequestAdminView toAdminView(Counsellor c) {
        return new CounsellorRequestAdminView(c.getId(), c.getUserId(), c.getName(), c.getTitle(), c.getBio(),
                c.getSpecialties(), c.getStatus());
    }
}
