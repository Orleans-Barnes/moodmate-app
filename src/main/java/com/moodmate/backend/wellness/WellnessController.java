package com.moodmate.backend.wellness;

import com.moodmate.backend.security.CurrentUser;
import com.moodmate.backend.wellness.dto.ToggleGoalResponse;
import com.moodmate.backend.wellness.dto.WellnessStateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wellness")
@RequiredArgsConstructor
public class WellnessController {

    private final WellnessService wellnessService;
    private final CurrentUser currentUser;

    @GetMapping("/state")
    public WellnessStateResponse state() {
        return wellnessService.getState(currentUser.id());
    }

    @PostMapping("/goals/{key}/toggle")
    public ToggleGoalResponse toggleGoal(@PathVariable String key) {
        return wellnessService.toggleGoal(currentUser.id(), key);
    }
}
