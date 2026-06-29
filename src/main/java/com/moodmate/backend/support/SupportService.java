package com.moodmate.backend.support;

import com.moodmate.backend.auth.AuthService;
import com.moodmate.backend.auth.dto.UserSummary;
import com.moodmate.backend.common.exception.BadRequestException;
import com.moodmate.backend.common.exception.ConflictException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.support.dto.AppointmentResponse;
import com.moodmate.backend.support.dto.BookAppointmentRequest;
import com.moodmate.backend.support.dto.ConversationResponse;
import com.moodmate.backend.support.dto.CounsellorDto;
import com.moodmate.backend.support.dto.CounsellorRequestAdminView;
import com.moodmate.backend.support.dto.CounsellorRequestInput;
import com.moodmate.backend.support.dto.CounsellorRequestResponse;
import com.moodmate.backend.support.dto.MessageResponse;
import com.moodmate.backend.support.dto.PeerMentorDto;
import com.moodmate.backend.support.dto.SendMessageRequest;
import com.moodmate.backend.support.dto.StartConversationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final CounsellorRepository counsellorRepository;
    private final PeerMentorRepository peerMentorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConversationRepository conversationRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<CounsellorDto> listCounsellors() {
        return counsellorRepository.findByStatusAndAvailableTrueOrderBySortOrder(CounsellorStatus.APPROVED)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public CounsellorRequestResponse requestCounsellorStatus(Long userId, CounsellorRequestInput request) {
        if (counsellorRepository.findByUserId(userId).isPresent()) {
            throw new ConflictException("You already have a counsellor request on file");
        }

        UserSummary requester = authService.getUserSummary(userId);

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

        eventPublisher.publishEvent(new CounsellorApprovedEvent(counsellor.getUserId()));
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
                .orElseThrow(() -> new ResourceNotFoundException("Counsellor request not found: " + counsellorId));
        if (counsellor.getStatus() != CounsellorStatus.PENDING) {
            throw new BadRequestException("This request has already been " + counsellor.getStatus());
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
                .orElseThrow(() -> new ResourceNotFoundException("Counsellor not found: " + request.counsellorId()));

        Appointment appointment = Appointment.builder()
                .userId(userId)
                .counsellorId(counsellor.getId())
                .scheduledAt(request.scheduledAt())
                .status(AppointmentStatus.PENDING)
                .notes(request.notes())
                .build();

        appointment = appointmentRepository.save(appointment);
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
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel an appointment that is already " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);

        String counsellorName = counsellorRepository.findById(appointment.getCounsellorId())
                .map(Counsellor::getName).orElse("Counsellor");
        return toResponse(appointment, counsellorName);
    }

    @Transactional
    public ConversationResponse startConversation(Long userId, StartConversationRequest request) {
        boolean hasCounsellor = request.counsellorId() != null;
        boolean hasMentor = request.peerMentorId() != null;
        if (hasCounsellor == hasMentor) {
            throw new BadRequestException("Provide exactly one of counsellorId or peerMentorId");
        }

        Conversation conversation;
        if (hasCounsellor) {
            Counsellor counsellor = counsellorRepository.findById(request.counsellorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Counsellor not found: " + request.counsellorId()));
            conversation = conversationRepository.findByUserIdAndCounsellorId(userId, counsellor.getId())
                    .orElseGet(() -> conversationRepository.save(Conversation.builder()
                            .userId(userId)
                            .counsellorId(counsellor.getId())
                            .build()));
        } else {
            PeerMentor mentor = peerMentorRepository.findById(request.peerMentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Peer mentor not found: " + request.peerMentorId()));
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

        return toMessageResponse(supportMessageRepository.save(message));
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

    private Conversation findOwnedConversation(Long userId, Long conversationId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
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
