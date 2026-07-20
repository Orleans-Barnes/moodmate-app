package com.moodmate.support.service;

import com.moodmate.support.client.AuthServiceClient;
import com.moodmate.support.client.PaymentsServiceClient;
import com.moodmate.support.dto.BookAppointmentRequest;
import com.moodmate.support.dto.SendMessageRequest;
import com.moodmate.support.entity.Appointment;
import com.moodmate.support.entity.AppointmentStatus;
import com.moodmate.support.entity.Conversation;
import com.moodmate.support.entity.Counsellor;
import com.moodmate.support.entity.CounsellorStatus;
import com.moodmate.support.entity.SupportMessage;
import com.moodmate.support.repository.AppointmentRepository;
import com.moodmate.support.repository.ConversationRepository;
import com.moodmate.support.repository.CounsellorRatingRepository;
import com.moodmate.support.repository.CounsellorRepository;
import com.moodmate.support.repository.MentorRequestRepository;
import com.moodmate.support.repository.PeerMentorRepository;
import com.moodmate.support.repository.SupportMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 9's Counsellor Message Routing and Appointment Routing wiring in SupportService.
 * AuthServiceClient is mocked - its own graceful-failure behavior is that class's own concern, not
 * retested here. */
class SupportServiceTest {

    private CounsellorRepository counsellorRepository;
    private ConversationRepository conversationRepository;
    private SupportMessageRepository supportMessageRepository;
    private AppointmentRepository appointmentRepository;
    private AuthServiceClient authServiceClient;
    private SupportService service;

    @BeforeEach
    void setUp() {
        counsellorRepository = mock(CounsellorRepository.class);
        PeerMentorRepository peerMentorRepository = mock(PeerMentorRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        conversationRepository = mock(ConversationRepository.class);
        supportMessageRepository = mock(SupportMessageRepository.class);
        // Phase 1G added mentorRequestRepository as a new SupportService constructor dependency
        // (@RequiredArgsConstructor picks up field declaration order); this test wasn't updated at
        // the time, which silently broke `mvn spring-boot:run`'s test-compile step ever since (it
        // never surfaced until someone actually ran a clean build - IDEs/prior runs likely used a
        // stale compiled class or skipped tests). Not exercised by any test here, so a plain mock
        // with no stubbing is enough.
        MentorRequestRepository mentorRequestRepository = mock(MentorRequestRepository.class);
        // Fix #5 added counsellorRatingRepository the same way Phase 1G added
        // mentorRequestRepository above - not exercised by any test here, plain mock is enough
        // (existsByAppointmentId defaults to false, countByCounsellorId to 0, both fine unstubbed).
        CounsellorRatingRepository counsellorRatingRepository = mock(CounsellorRatingRepository.class);
        authServiceClient = mock(AuthServiceClient.class);
        // Premium gating breadth (Milestone item 7) added paymentsServiceClient the same way Fix #5
        // added counsellorRatingRepository above - bookAppointmentNotifiesCounsellor below calls
        // bookAppointment(), which now calls paymentsServiceClient.isPro(), so this needs at least
        // an unstubbed mock (defaults to false) to avoid an NPE, even though no test asserts on it.
        PaymentsServiceClient paymentsServiceClient = mock(PaymentsServiceClient.class);

        service = new SupportService(counsellorRepository, peerMentorRepository, appointmentRepository,
                conversationRepository, supportMessageRepository, mentorRequestRepository,
                counsellorRatingRepository, authServiceClient, paymentsServiceClient);

        when(supportMessageRepository.save(any(SupportMessage.class))).thenAnswer(inv -> {
            SupportMessage m = inv.getArgument(0);
            m.setId(1L);
            m.setCreatedAt(Instant.now());
            return m;
        });
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            if (a.getId() == null) a.setId(1L);
            a.setCreatedAt(Instant.now());
            a.setUpdatedAt(Instant.now());
            return a;
        });
    }

    @Test
    void sendMessageNotifiesLinkedCounsellorWithCounsellorChatScreen() {
        Conversation conversation = Conversation.builder().id(5L).userId(3L).counsellorId(10L).build();
        when(conversationRepository.findByIdAndUserId(5L, 3L)).thenReturn(Optional.of(conversation));
        Counsellor counsellor = Counsellor.builder().id(10L).userId(20L).name("Dr. Adjei")
                .avatarEmoji("🧑").status(CounsellorStatus.APPROVED).build();
        when(counsellorRepository.findById(10L)).thenReturn(Optional.of(counsellor));

        service.sendMessage(3L, 5L, new SendMessageRequest("I need to talk"));

        verify(authServiceClient).notify(eq(20L), eq("New message"), any(),
                eq(Map.of("screen", "CounsellorChat", "conversationId", "5")));
    }

    @Test
    void sendMessageSkipsNotifyWhenCounsellorHasNoLinkedAccount() {
        Conversation conversation = Conversation.builder().id(5L).userId(3L).counsellorId(10L).build();
        when(conversationRepository.findByIdAndUserId(5L, 3L)).thenReturn(Optional.of(conversation));
        Counsellor counsellor = Counsellor.builder().id(10L).userId(null).name("Legacy Counsellor")
                .avatarEmoji("🧑").status(CounsellorStatus.APPROVED).build();
        when(counsellorRepository.findById(10L)).thenReturn(Optional.of(counsellor));

        assertDoesNotThrow(() -> service.sendMessage(3L, 5L, new SendMessageRequest("hi")));

        verify(authServiceClient, never()).notify(any(), any(), any(), any());
    }

    @Test
    void sendMessageSkipsNotifyEntirelyForPeerMentorConversations() {
        Conversation conversation = Conversation.builder().id(6L).userId(3L).peerMentorId(99L).build();
        when(conversationRepository.findByIdAndUserId(6L, 3L)).thenReturn(Optional.of(conversation));

        service.sendMessage(3L, 6L, new SendMessageRequest("hi"));

        verify(authServiceClient, never()).notify(any(), any(), any(), any());
        verify(counsellorRepository, never()).findById(any());
    }

    @Test
    void sendCounsellorMessageNotifiesStudentWithChatScreen() {
        Counsellor counsellor = Counsellor.builder().id(10L).userId(20L).name("Dr. Adjei")
                .avatarEmoji("🧑").status(CounsellorStatus.APPROVED).build();
        when(counsellorRepository.findByUserId(20L)).thenReturn(Optional.of(counsellor));
        Conversation conversation = Conversation.builder().id(5L).userId(3L).counsellorId(10L).build();
        when(conversationRepository.findByIdAndCounsellorId(5L, 10L)).thenReturn(Optional.of(conversation));

        service.sendCounsellorMessage(20L, 5L, new SendMessageRequest("How are you feeling?"));

        verify(authServiceClient).notify(eq(3L), eq("New message"), any(),
                eq(Map.of("screen", "Chat", "conversationId", "5")));
    }

    @Test
    void bookAppointmentNotifiesCounsellor() {
        Counsellor counsellor = Counsellor.builder().id(10L).userId(20L).name("Dr. Adjei")
                .avatarEmoji("🧑").status(CounsellorStatus.APPROVED).build();
        when(counsellorRepository.findById(10L)).thenReturn(Optional.of(counsellor));

        service.bookAppointment(3L, new BookAppointmentRequest(10L, Instant.now().plusSeconds(3600), null));

        verify(authServiceClient).notify(eq(20L), eq("New appointment request"), any(),
                eq(Map.of("screen", "Appointments", "appointmentId", "1")));
    }

    @Test
    void confirmAppointmentNotifiesStudent() {
        Counsellor counsellor = Counsellor.builder().id(10L).userId(20L).name("Dr. Adjei")
                .avatarEmoji("🧑").status(CounsellorStatus.APPROVED).build();
        when(counsellorRepository.findByUserId(20L)).thenReturn(Optional.of(counsellor));
        Appointment appointment = Appointment.builder().id(1L).userId(3L).counsellorId(10L)
                .scheduledAt(Instant.now()).status(AppointmentStatus.PENDING).build();
        when(appointmentRepository.findByIdAndCounsellorId(1L, 10L)).thenReturn(Optional.of(appointment));
        when(authServiceClient.getUserSummaries(List.of(3L))).thenReturn(Map.of());

        service.confirmAppointment(20L, 1L);

        verify(authServiceClient).notify(eq(3L), eq("Appointment confirmed"), any(),
                eq(Map.of("screen", "Appointments", "appointmentId", "1")));
    }
}
