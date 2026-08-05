package com.moodmate.support.controller;

import com.moodmate.support.client.AuditLogServiceClient;
import com.moodmate.support.dto.AdminEditCounsellorRequest;
import com.moodmate.support.dto.AppointmentResponse;
import com.moodmate.support.dto.BookAppointmentRequest;
import com.moodmate.support.dto.BookedSlotView;
import com.moodmate.support.dto.ConversationResponse;
import com.moodmate.support.dto.CounsellorAnalyticsResponse;
import com.moodmate.support.dto.CounsellorAppointmentView;
import com.moodmate.support.dto.CounsellorConversationView;
import com.moodmate.support.dto.CounsellorDto;
import com.moodmate.support.dto.CounsellorRatingResponse;
import com.moodmate.support.dto.CounsellorRequestAdminView;
import com.moodmate.support.dto.CounsellorRequestInput;
import com.moodmate.support.dto.CounsellorRequestResponse;
import com.moodmate.support.dto.EscalationCaseView;
import com.moodmate.support.dto.EscalationFeedbackRequest;
import com.moodmate.support.dto.SubmitEscalationRequest;
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
import com.moodmate.support.dto.RescheduleAppointmentRequest;
import com.moodmate.support.dto.SendMessageRequest;
import com.moodmate.support.dto.StartConversationRequest;
import com.moodmate.support.dto.UpdateAvailabilityStatusRequest;
import com.moodmate.support.entity.CounsellorAvailabilityStatus;
import com.moodmate.support.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

/** Consolidated into one controller matching the monolith's SupportController exactly (routes and
 * all), replacing the pre-existing stub's three separate controllers (CounsellorController,
 * AppointmentController, MessageController), whose routes (/api/support/counsellors/apply,
 * /api/support/messages/counsellor/{id}, ...) didn't match the monolith's real API shape at all.
 * Role checks use the X-User-Role header the gateway's JwtAuthFilter sets from the verified JWT,
 * replacing the monolith's @PreAuthorize("hasRole(...)") - these services have no Spring Security
 * dependency, same pattern as moodmate-mood's CheckInController.studentTrend. */
@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;
    private final AuditLogServiceClient auditLogServiceClient;

    @GetMapping("/counsellors")
    public List<CounsellorDto> counsellors() {
        return supportService.listCounsellors();
    }

    @GetMapping("/counsellors/{id}/booked-slots")
    public List<BookedSlotView> bookedCounsellorSlots(@PathVariable Long id,
                                                       @RequestParam Instant from,
                                                       @RequestParam Instant to) {
        return supportService.listBookedSlots(id, from, to);
    }

    @GetMapping("/mentors")
    public List<PeerMentorDto> mentors() {
        return supportService.listPeerMentors();
    }

    @PostMapping("/counsellor-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public CounsellorRequestResponse requestCounsellorStatus(@RequestHeader("X-User-Id") Long userId,
                                                              @Valid @RequestBody CounsellorRequestInput request) {
        return supportService.requestCounsellorStatus(userId, request);
    }

    @GetMapping("/counsellor-requests/pending")
    public List<CounsellorRequestAdminView> pendingCounsellorRequests(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return supportService.listPendingCounsellorRequests();
    }

    @PostMapping("/counsellor-requests/{id}/approve")
    public CounsellorRequestAdminView approveCounsellorRequest(@RequestHeader("X-User-Role") String role,
                                                                @RequestHeader("X-User-Id") Long adminUserId,
                                                                @PathVariable Long id) {
        requireAdmin(role);
        CounsellorRequestAdminView result = supportService.approveCounsellorRequest(id);
        auditLogServiceClient.record(adminUserId, "APPROVE_COUNSELLOR", "COUNSELLOR", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/counsellor-requests/{id}/reject")
    public CounsellorRequestAdminView rejectCounsellorRequest(@RequestHeader("X-User-Role") String role,
                                                               @RequestHeader("X-User-Id") Long adminUserId,
                                                               @PathVariable Long id) {
        requireAdmin(role);
        CounsellorRequestAdminView result = supportService.rejectCounsellorRequest(id);
        auditLogServiceClient.record(adminUserId, "REJECT_COUNSELLOR", "COUNSELLOR", String.valueOf(id), null);
        return result;
    }

    // ── Phase 1H (Admin Portal - Counsellor Management) - all statuses, plus suspend/reinstate/
    // edit for an already-APPROVED row. Kept under the same "/counsellor-requests" prefix as
    // approve/reject above, since it's the same Counsellor row/id space, just a superset of
    // actions on it. ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/counsellor-requests")
    public List<CounsellorRequestAdminView> allCounsellorsForAdmin(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return supportService.listAllCounsellorsForAdmin();
    }

    @PostMapping("/counsellor-requests/{id}/suspend")
    public CounsellorRequestAdminView suspendCounsellor(@RequestHeader("X-User-Role") String role,
                                                          @RequestHeader("X-User-Id") Long adminUserId,
                                                          @PathVariable Long id) {
        requireAdmin(role);
        CounsellorRequestAdminView result = supportService.suspendCounsellor(id);
        auditLogServiceClient.record(adminUserId, "SUSPEND_COUNSELLOR", "COUNSELLOR", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/counsellor-requests/{id}/reinstate")
    public CounsellorRequestAdminView reinstateCounsellor(@RequestHeader("X-User-Role") String role,
                                                            @RequestHeader("X-User-Id") Long adminUserId,
                                                            @PathVariable Long id) {
        requireAdmin(role);
        CounsellorRequestAdminView result = supportService.reinstateCounsellor(id);
        auditLogServiceClient.record(adminUserId, "REINSTATE_COUNSELLOR", "COUNSELLOR", String.valueOf(id), null);
        return result;
    }

    @PatchMapping("/counsellor-requests/{id}")
    public CounsellorRequestAdminView adminEditCounsellor(@RequestHeader("X-User-Role") String role,
                                                            @RequestHeader("X-User-Id") Long adminUserId,
                                                            @PathVariable Long id,
                                                            @RequestBody AdminEditCounsellorRequest request) {
        requireAdmin(role);
        CounsellorRequestAdminView result = supportService.adminEditCounsellor(id, request);
        auditLogServiceClient.record(adminUserId, "EDIT_COUNSELLOR", "COUNSELLOR", String.valueOf(id), null);
        return result;
    }

    // ── Phase 1H (Admin Portal - Peer Mentor Management) ─────────────────────────────────────────

    @GetMapping("/mentors/admin")
    public List<PeerMentorAdminView> allMentorsForAdmin(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return supportService.listAllPeerMentorsForAdmin();
    }

    @PostMapping("/mentors/{id}/deactivate")
    public PeerMentorAdminView deactivateMentor(@RequestHeader("X-User-Role") String role,
                                                 @RequestHeader("X-User-Id") Long adminUserId,
                                                 @PathVariable Long id) {
        requireAdmin(role);
        PeerMentorAdminView result = supportService.setPeerMentorActive(id, false);
        auditLogServiceClient.record(adminUserId, "DEACTIVATE_MENTOR", "PEER_MENTOR", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/mentors/{id}/activate")
    public PeerMentorAdminView activateMentor(@RequestHeader("X-User-Role") String role,
                                               @RequestHeader("X-User-Id") Long adminUserId,
                                               @PathVariable Long id) {
        requireAdmin(role);
        PeerMentorAdminView result = supportService.setPeerMentorActive(id, true);
        auditLogServiceClient.record(adminUserId, "ACTIVATE_MENTOR", "PEER_MENTOR", String.valueOf(id), null);
        return result;
    }

    // ── Fix #4 (Peer Mentor self-serve application flow) - mirrors the counsellor-requests block
    // above field-for-field. ────────────────────────────────────────────────────────────────────

    @PostMapping("/mentor-applications")
    @ResponseStatus(HttpStatus.CREATED)
    public PeerMentorApplicationResponse applyAsPeerMentor(@RequestHeader("X-User-Id") Long userId,
                                                             @Valid @RequestBody PeerMentorApplicationInput request) {
        return supportService.applyAsPeerMentor(userId, request);
    }

    @GetMapping("/mentor-applications/pending")
    public List<PeerMentorAdminView> pendingMentorApplications(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return supportService.listPendingPeerMentorApplications();
    }

    @PostMapping("/mentor-applications/{id}/approve")
    public PeerMentorAdminView approveMentorApplication(@RequestHeader("X-User-Role") String role,
                                                          @RequestHeader("X-User-Id") Long adminUserId,
                                                          @PathVariable Long id) {
        requireAdmin(role);
        PeerMentorAdminView result = supportService.approvePeerMentorApplication(id);
        auditLogServiceClient.record(adminUserId, "APPROVE_MENTOR_APPLICATION", "PEER_MENTOR", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/mentor-applications/{id}/reject")
    public PeerMentorAdminView rejectMentorApplication(@RequestHeader("X-User-Role") String role,
                                                         @RequestHeader("X-User-Id") Long adminUserId,
                                                         @PathVariable Long id) {
        requireAdmin(role);
        PeerMentorAdminView result = supportService.rejectPeerMentorApplication(id);
        auditLogServiceClient.record(adminUserId, "REJECT_MENTOR_APPLICATION", "PEER_MENTOR", String.valueOf(id), null);
        return result;
    }

    // ── Academy self-service auto-approval (Peer Mentor only) ────────────────────────────────────
    // Called by the frontend after a user completes the academy training + agrees to T&Cs. No ADMIN
    // role required - the user is approving their own application after completing the required
    // certification. The service verifies they have a PENDING application on file before granting
    // MENTOR role. This replaces the old "wait for admin" flow for the peer mentor academy path.
    @PostMapping("/mentor-applications/self-approve")
    public PeerMentorApplicationResponse selfApproveMentorApplication(@RequestHeader("X-User-Id") Long userId) {
        return supportService.selfApprovePeerMentor(userId);
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse bookAppointment(@RequestHeader("X-User-Id") Long userId,
                                                @Valid @RequestBody BookAppointmentRequest request) {
        return supportService.bookAppointment(userId, request);
    }

    @GetMapping("/appointments")
    public List<AppointmentResponse> appointments(@RequestHeader("X-User-Id") Long userId) {
        return supportService.listAppointments(userId);
    }

    @PostMapping("/appointments/{id}/cancel")
    public AppointmentResponse cancelAppointment(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return supportService.cancelAppointment(userId, id);
    }

    // Phase 1F-A - student-initiated reschedule. POST rather than PATCH to match every other
    // state-changing route in this controller (cancel/confirm/complete are all POST too) - no
    // route here has ever used PUT/PATCH, so introducing one now would be an inconsistency, not
    // an improvement.
    @PostMapping("/appointments/{id}/reschedule")
    public AppointmentResponse rescheduleAppointment(@RequestHeader("X-User-Id") Long userId,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody RescheduleAppointmentRequest request) {
        return supportService.rescheduleAppointment(userId, id, request.scheduledAt());
    }

    // Phase 1F-B - Jitsi meeting credentials, student side. Withholds the room name/join URL
    // entirely unless the appointment is CONFIRMED and the current time is inside the join window
    // - see SupportService.buildMeetingWindow for why that withholding is the real access control.
    @GetMapping("/appointments/{id}/meeting")
    public MeetingWindowView appointmentMeeting(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return supportService.getStudentMeetingWindow(userId, id);
    }

    // Fix #5 (rating/review system) - student-facing, gated to their own COMPLETED appointment
    // (ownership + status both enforced in the service, same pattern as cancel/reschedule above).
    @PostMapping("/appointments/{id}/rating")
    @ResponseStatus(HttpStatus.CREATED)
    public CounsellorRatingResponse submitCounsellorRating(@RequestHeader("X-User-Id") Long userId,
                                                             @PathVariable Long id,
                                                             @Valid @RequestBody SubmitCounsellorRatingRequest request) {
        return supportService.submitCounsellorRating(userId, id, request);
    }

    @GetMapping("/counsellor/appointments")
    public List<CounsellorAppointmentView> counsellorAppointments(@RequestHeader("X-User-Role") String role,
                                                                   @RequestHeader("X-User-Id") Long userId) {
        requireCounsellor(role);
        return supportService.listCounsellorAppointments(userId);
    }

    @PostMapping("/counsellor/appointments/{id}/confirm")
    public CounsellorAppointmentView confirmAppointment(@RequestHeader("X-User-Role") String role,
                                                         @RequestHeader("X-User-Id") Long userId,
                                                         @PathVariable Long id) {
        requireCounsellor(role);
        return supportService.confirmAppointment(userId, id);
    }

    @PostMapping("/counsellor/appointments/{id}/complete")
    public CounsellorAppointmentView completeAppointment(@RequestHeader("X-User-Role") String role,
                                                          @RequestHeader("X-User-Id") Long userId,
                                                          @PathVariable Long id) {
        requireCounsellor(role);
        return supportService.completeAppointment(userId, id);
    }

    @PostMapping("/counsellor/appointments/{id}/cancel")
    public CounsellorAppointmentView cancelAppointmentAsCounsellor(@RequestHeader("X-User-Role") String role,
                                                                    @RequestHeader("X-User-Id") Long userId,
                                                                    @PathVariable Long id) {
        requireCounsellor(role);
        return supportService.cancelAppointmentAsCounsellor(userId, id);
    }

    // Phase 1F-B - Jitsi meeting credentials, counsellor side. Mirrors appointmentMeeting above.
    @GetMapping("/counsellor/appointments/{id}/meeting")
    public MeetingWindowView counsellorAppointmentMeeting(@RequestHeader("X-User-Role") String role,
                                                            @RequestHeader("X-User-Id") Long userId,
                                                            @PathVariable Long id) {
        requireCounsellor(role);
        return supportService.getCounsellorMeetingWindow(userId, id);
    }

    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse startConversation(@RequestHeader("X-User-Id") Long userId,
                                                   @RequestBody StartConversationRequest request) {
        return supportService.startConversation(userId, request);
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> conversations(@RequestHeader("X-User-Id") Long userId) {
        return supportService.listConversations(userId);
    }

    @GetMapping("/conversations/{id}/messages")
    public Page<MessageResponse> messages(@RequestHeader("X-User-Id") Long userId,
                                           @PathVariable Long id,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        return supportService.listMessages(userId, id, PageRequest.of(page, size));
    }

    @PostMapping("/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(@RequestHeader("X-User-Id") Long userId,
                                        @PathVariable Long id,
                                        @Valid @RequestBody SendMessageRequest request) {
        return supportService.sendMessage(userId, id, request);
    }

    @PostMapping("/conversations/{id}/read")
    public void markRead(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        supportService.markRead(userId, id);
    }

    @GetMapping("/counsellor/conversations")
    public List<CounsellorConversationView> counsellorConversations(@RequestHeader("X-User-Role") String role,
                                                                      @RequestHeader("X-User-Id") Long userId) {
        requireCounsellor(role);
        return supportService.listCounsellorConversations(userId);
    }

    @GetMapping("/counsellor/conversations/{id}/messages")
    public Page<MessageResponse> counsellorMessages(@RequestHeader("X-User-Role") String role,
                                                      @RequestHeader("X-User-Id") Long userId,
                                                      @PathVariable Long id,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "50") int size) {
        requireCounsellor(role);
        return supportService.listCounsellorMessages(userId, id, PageRequest.of(page, size));
    }

    @PostMapping("/counsellor/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendCounsellorMessage(@RequestHeader("X-User-Role") String role,
                                                  @RequestHeader("X-User-Id") Long userId,
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody SendMessageRequest request) {
        requireCounsellor(role);
        return supportService.sendCounsellorMessage(userId, id, request);
    }

    @PostMapping("/counsellor/conversations/{id}/read")
    public void markCounsellorRead(@RequestHeader("X-User-Role") String role,
                                    @RequestHeader("X-User-Id") Long userId,
                                    @PathVariable Long id) {
        requireCounsellor(role);
        supportService.markReadAsCounsellor(userId, id);
    }

    // Phase 1F-A - persists the counsellor dashboard's Online/Busy/Away toggle (previously local-
    // only React state, never seen by students). Read back via GET /api/support/counsellors.
    @PostMapping("/counsellor/availability-status")
    public CounsellorAvailabilityStatus updateAvailabilityStatus(@RequestHeader("X-User-Role") String role,
                                                                   @RequestHeader("X-User-Id") Long userId,
                                                                   @Valid @RequestBody UpdateAvailabilityStatusRequest request) {
        requireCounsellor(role);
        return supportService.updateAvailabilityStatus(userId, request.availabilityStatus());
    }

    // Counsellor Platform (Milestone 4) - "get my own status" endpoint. Fills the documented gap
    // where the dashboard used to have no way to restore its last-saved toggle on first render
    // (see CounsellorDashboardScreen.tsx's doc comment) without re-fetching the whole counsellor list.
    @GetMapping("/counsellor/me/status")
    public CounsellorAvailabilityStatus myAvailabilityStatus(@RequestHeader("X-User-Role") String role,
                                                               @RequestHeader("X-User-Id") Long userId) {
        requireCounsellor(role);
        return supportService.getMyAvailabilityStatus(userId);
    }

    // Phase 1F-A - backs the counsellor dashboard's analytics cards.
    @GetMapping("/counsellor/analytics")
    public CounsellorAnalyticsResponse counsellorAnalytics(@RequestHeader("X-User-Role") String role,
                                                            @RequestHeader("X-User-Id") Long userId) {
        requireCounsellor(role);
        return supportService.counsellorAnalytics(userId);
    }

    // ── Phase 1G - Peer Mentor request/accept workflow ─────────────────────────────────────────

    // Admin-only account linkage - see SupportService.linkMentorAccount's doc comment.
    @PostMapping("/mentors/{id}/link-account")
    public PeerMentorDto linkMentorAccount(@RequestHeader("X-User-Role") String role,
                                            @PathVariable Long id,
                                            @Valid @RequestBody LinkMentorAccountRequest request) {
        requireAdmin(role);
        return supportService.linkMentorAccount(id, request.userId());
    }

    @PostMapping("/mentor-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public MentorRequestResponse requestMentor(@RequestHeader("X-User-Id") Long userId,
                                                @Valid @RequestBody RequestMentorRequest request) {
        return supportService.requestMentor(userId, request);
    }

    @GetMapping("/mentor-requests")
    public List<MentorRequestResponse> myMentorRequests(@RequestHeader("X-User-Id") Long userId) {
        return supportService.listMyMentorRequests(userId);
    }

    @GetMapping("/mentor/requests")
    public List<MentorRequestView> mentorRequests(@RequestHeader("X-User-Role") String role,
                                                    @RequestHeader("X-User-Id") Long userId) {
        requireMentor(role);
        return supportService.listMentorRequestsForMentor(userId);
    }

    @PostMapping("/mentor/requests/{id}/accept")
    public MentorRequestView acceptMentorRequest(@RequestHeader("X-User-Role") String role,
                                                  @RequestHeader("X-User-Id") Long userId,
                                                  @PathVariable Long id) {
        requireMentor(role);
        return supportService.acceptMentorRequest(userId, id);
    }

    @PostMapping("/mentor/requests/{id}/decline")
    public MentorRequestView declineMentorRequest(@RequestHeader("X-User-Role") String role,
                                                   @RequestHeader("X-User-Id") Long userId,
                                                   @PathVariable Long id) {
        requireMentor(role);
        return supportService.declineMentorRequest(userId, id);
    }

    @GetMapping("/mentor/conversations")
    public List<CounsellorConversationView> mentorConversations(@RequestHeader("X-User-Role") String role,
                                                                   @RequestHeader("X-User-Id") Long userId) {
        requireMentor(role);
        return supportService.listMentorConversations(userId);
    }

    @GetMapping("/mentor/conversations/{id}/messages")
    public Page<MessageResponse> mentorMessages(@RequestHeader("X-User-Role") String role,
                                                  @RequestHeader("X-User-Id") Long userId,
                                                  @PathVariable Long id,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "50") int size) {
        requireMentor(role);
        return supportService.listMentorMessages(userId, id, PageRequest.of(page, size));
    }

    @PostMapping("/mentor/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMentorMessage(@RequestHeader("X-User-Role") String role,
                                              @RequestHeader("X-User-Id") Long userId,
                                              @PathVariable Long id,
                                              @Valid @RequestBody SendMessageRequest request) {
        requireMentor(role);
        return supportService.sendMentorMessage(userId, id, request);
    }

    @PostMapping("/mentor/conversations/{id}/read")
    public void markMentorRead(@RequestHeader("X-User-Role") String role,
                                @RequestHeader("X-User-Id") Long userId,
                                @PathVariable Long id) {
        requireMentor(role);
        supportService.markReadAsMentor(userId, id);
    }

    // ── Collaboration Hub (Mentor ↔ Counsellor escalation) ───────────────────────────────────────

    // Mentor submits a new escalation case
    @PostMapping("/escalations")
    @ResponseStatus(HttpStatus.CREATED)
    public EscalationCaseView submitEscalation(@RequestHeader("X-User-Role") String role,
                                               @RequestHeader("X-User-Id") Long userId,
                                               @Valid @RequestBody SubmitEscalationRequest request) {
        requireMentor(role);
        return supportService.submitEscalation(userId, request);
    }

    // Mentor views their own escalation history
    @GetMapping("/escalations/mine")
    public List<EscalationCaseView> myEscalations(@RequestHeader("X-User-Role") String role,
                                                   @RequestHeader("X-User-Id") Long userId) {
        requireMentor(role);
        return supportService.listMyEscalations(userId);
    }

    // Counsellor views all escalations across all mentors
    @GetMapping("/escalations")
    public List<EscalationCaseView> allEscalations(@RequestHeader("X-User-Role") String role,
                                                    @RequestHeader("X-User-Id") Long userId) {
        requireCounsellor(role);
        return supportService.listAllEscalations();
    }

    // Counsellor marks a case as IN_REVIEW
    @PostMapping("/escalations/{id}/review")
    public EscalationCaseView markInReview(@RequestHeader("X-User-Role") String role,
                                            @RequestHeader("X-User-Id") Long userId,
                                            @PathVariable Long id) {
        requireCounsellor(role);
        return supportService.markEscalationInReview(userId, id);
    }

    // Counsellor sends feedback
    @PostMapping("/escalations/{id}/feedback")
    public EscalationCaseView sendFeedback(@RequestHeader("X-User-Role") String role,
                                            @RequestHeader("X-User-Id") Long userId,
                                            @PathVariable Long id,
                                            @Valid @RequestBody EscalationFeedbackRequest request) {
        requireCounsellor(role);
        return supportService.sendEscalationFeedback(userId, id, request);
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }

    private void requireCounsellor(String role) {
        if (!"COUNSELLOR".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires COUNSELLOR role");
        }
    }

    private void requireMentor(String role) {
        if (!"MENTOR".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires MENTOR role");
        }
    }
}
