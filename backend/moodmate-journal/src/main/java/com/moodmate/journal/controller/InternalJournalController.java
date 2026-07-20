package com.moodmate.journal.controller;

import com.moodmate.journal.dto.UserLastJournalEntryResponse;
import com.moodmate.journal.service.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Service-to-service only, same /internal/** pattern as moodmate-mood's InternalMoodController and
 * moodmate-wallet's InternalWalletController - deliberately NOT under /api/journal/**, so no
 * gateway route can forward it. Added for Phase 1E Step 4 (Scheduling Rules) -
 * moodmate-notifications' JournalServiceClient/JournalReminderScheduledJob polls this.
 */
@RestController
@RequestMapping("/internal/journal")
@RequiredArgsConstructor
public class InternalJournalController {

    private final JournalService journalService;

    @GetMapping("/latest-per-user")
    public List<UserLastJournalEntryResponse> latestPerUser() {
        return journalService.latestEntryPerUser();
    }
}
