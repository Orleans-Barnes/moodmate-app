package com.moodmate.support.controller;

import com.moodmate.support.dto.ConfirmedAppointmentResponse;
import com.moodmate.support.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Service-to-service only, same /internal/** pattern as moodmate-mood's InternalMoodController and
 * moodmate-wallet's InternalWalletController - deliberately NOT under /api/support/**, so no
 * gateway route can forward it. Added for Phase 1E Step 4 (Scheduling Rules) -
 * moodmate-notifications' AppointmentServiceClient/AppointmentReminderScheduledJob polls this.
 */
@RestController
@RequestMapping("/internal/support")
@RequiredArgsConstructor
public class InternalSupportController {

    private final SupportService supportService;

    @GetMapping("/appointments/confirmed")
    public List<ConfirmedAppointmentResponse> confirmedAppointments() {
        return supportService.confirmedAppointments();
    }
}
