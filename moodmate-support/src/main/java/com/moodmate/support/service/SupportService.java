package com.moodmate.support.service;

import com.moodmate.support.client.AuthServiceClient;
import com.moodmate.support.client.UserSummary;
import com.moodmate.support.dto.AppointmentResponse;
import com.moodmate.support.dto.BookAppointmentRequest;
import com.moodmate.support.dto.ConfirmedAppointmentResponse;
import com.moodmate.support.dto.ConversationResponse;
import com.moodmate.support.dto.CounsellorAppointmentView;
import com.moodmate.support.dto.CounsellorConversationView;
import com.moodmate.support.dto.CounsellorDto;
import com.moodmate.support.dto.CounsellorRequestAdminView;
import com.moodmate.support.dto.CounsellorRequestInput;
import com.moodmate.support.dto.CounsellorRequestResponse;
import com.moodmate.support.dto.MessageResponse;
import com.moodmate.support.dto.PeerMentorDto;
import com.moodmate.support.dto.SendMessageRequest;
import com.moodmate.support.dto.StartConversationRequest;
import com.moodmate.support.entity.Appointment;
import com.moodmate.support.entity.AppointmentStatus;
import com.moodmate.support.entity.Conversation;
import com.moodmate.support.entity.Counsellor;
import com.moodmate.support.entity.CounsellorStatus;
import com.moodmate.support.entity.PeerMentor;
import com.moodmate.support.entity.SenderType;
import com.moodmate.support.entity.SupportMessage;
import com.moodmate.support.exception.ApiException;
import com.moodmate.support.repository.AppointmentRepository;
import com.moodmate.support.repository.ConversationRepository;
import com.moodmate.support.repository.CounsellorRepository;
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
        UserSummary student = students.get(c.getUserId());
        String preview = supportMessageRepository.findTopByConversationIdOrderByCreatedAtDesc(c.getId())
                .map(SupportMessage::getBody).orElse(null);
        long unreadCount = supportMessageRepository
                .countByConversationIdAndSenderTypeNotAndReadAtIsNull(c.getId(), SenderType.COUNSELLOR);
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
                c.isAvailable());
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
