package com.moodmate.backend.sleep;

import com.moodmate.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/sleep")
@RequiredArgsConstructor
public class SleepController {

    private final SleepLogRepository sleepRepo;
    private final CurrentUser        currentUser;

    record SleepInput(String logDate, String bedtime, String wakeTime,
                      Integer durationMins, Short quality, String notes) {}
    record SleepView(Long id, String logDate, String bedtime, String wakeTime,
                     Integer durationMins, Short quality, String notes) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<SleepView> list() {
        return sleepRepo.findByUserIdOrderByLogDateDesc(currentUser.id())
                .stream().map(this::toView).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SleepView log(@RequestBody SleepInput input) {
        Long userId  = currentUser.id();
        LocalDate date = input.logDate() != null ? LocalDate.parse(input.logDate()) : LocalDate.now();

        // Upsert — overwrite if exists for same date
        SleepLog log = sleepRepo.findByUserIdAndLogDate(userId, date)
                .orElse(SleepLog.builder().userId(userId).logDate(date).build());

        if (input.bedtime()  != null) log.setBedtime(LocalTime.parse(input.bedtime()));
        if (input.wakeTime() != null) log.setWakeTime(LocalTime.parse(input.wakeTime()));
        if (input.durationMins() != null) log.setDurationMins(input.durationMins());
        if (input.quality()  != null) log.setQuality(input.quality());
        log.setNotes(input.notes());

        return toView(sleepRepo.save(log));
    }

    private SleepView toView(SleepLog s) {
        return new SleepView(s.getId(), s.getLogDate().toString(),
                s.getBedtime()  != null ? s.getBedtime().toString()  : null,
                s.getWakeTime() != null ? s.getWakeTime().toString() : null,
                s.getDurationMins(), s.getQuality(), s.getNotes());
    }
}
