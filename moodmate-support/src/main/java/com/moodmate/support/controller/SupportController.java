package com.moodmate.support.controller;

import com.moodmate.support.dto.AppointmentResponse;
import com.moodmate.support.dto.BookAppointmentRequest;
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
import com.moodmate.support.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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

    @GetMapping("/counsellors")
    public List<CounsellorDto> counsellors() {
        return supportService.listCounsellors();
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
                                                                @PathVariable Long id) {
        requireAdmin(role);
        return supportService.approveCounsellorRequest(id);
    }

    @PostMapping("/counsellor-requests/{id}/reject")
    public CounsellorRequestAdminView rejectCounsellorRequest(@RequestHeader("X-User-Role") String role,
                                                               @PathVariable Long id) {
        requireAdmin(role);
        return supportService.rejectCounsellorRequest(id);
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
}
