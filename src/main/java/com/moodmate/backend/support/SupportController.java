package com.moodmate.backend.support;

import com.moodmate.backend.security.CurrentUser;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;
    private final CurrentUser currentUser;

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
    public CounsellorRequestResponse requestCounsellorStatus(@Valid @RequestBody CounsellorRequestInput request) {
        return supportService.requestCounsellorStatus(currentUser.id(), request);
    }

    @GetMapping("/counsellor-requests/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CounsellorRequestAdminView> pendingCounsellorRequests() {
        return supportService.listPendingCounsellorRequests();
    }

    @PostMapping("/counsellor-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public CounsellorRequestAdminView approveCounsellorRequest(@PathVariable Long id) {
        return supportService.approveCounsellorRequest(id);
    }

    @PostMapping("/counsellor-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public CounsellorRequestAdminView rejectCounsellorRequest(@PathVariable Long id) {
        return supportService.rejectCounsellorRequest(id);
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse bookAppointment(@Valid @RequestBody BookAppointmentRequest request) {
        return supportService.bookAppointment(currentUser.id(), request);
    }

    @GetMapping("/appointments")
    public List<AppointmentResponse> appointments() {
        return supportService.listAppointments(currentUser.id());
    }

    @PostMapping("/appointments/{id}/cancel")
    public AppointmentResponse cancelAppointment(@PathVariable Long id) {
        return supportService.cancelAppointment(currentUser.id(), id);
    }

    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse startConversation(@RequestBody StartConversationRequest request) {
        return supportService.startConversation(currentUser.id(), request);
    }

    @GetMapping("/conversations")
    public List<ConversationResponse> conversations() {
        return supportService.listConversations(currentUser.id());
    }

    @GetMapping("/conversations/{id}/messages")
    public Page<MessageResponse> messages(@PathVariable Long id,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "50") int size) {
        return supportService.listMessages(currentUser.id(), id, PageRequest.of(page, size));
    }

    @PostMapping("/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(@PathVariable Long id, @Valid @RequestBody SendMessageRequest request) {
        return supportService.sendMessage(currentUser.id(), id, request);
    }

    @PostMapping("/conversations/{id}/read")
    public void markRead(@PathVariable Long id) {
        supportService.markRead(currentUser.id(), id);
    }
}
