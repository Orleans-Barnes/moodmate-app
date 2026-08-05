package com.moodmate.gamification.controller;

import com.moodmate.gamification.dto.AchievementUnlockRequest;
import com.moodmate.gamification.dto.MissionProgressRequest;
import com.moodmate.gamification.entity.Achievement;
import com.moodmate.gamification.entity.Mission;
import com.moodmate.gamification.entity.UserAchievement;
import com.moodmate.gamification.entity.UserMissionProgress;
import com.moodmate.gamification.service.GamificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/achievements")
    public List<Achievement> allAchievements() {
        return gamificationService.allAchievements();
    }

    @GetMapping("/achievements/mine")
    public List<UserAchievement> myAchievements(@RequestHeader("X-User-Id") Long userId) {
        return gamificationService.myAchievements(userId);
    }

    @PostMapping("/achievements/unlock")
    public ResponseEntity<UserAchievement> unlock(@RequestHeader("X-User-Id") Long userId,
                                                    @Valid @RequestBody AchievementUnlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gamificationService.unlock(userId, request.achievementKey()));
    }

    @GetMapping("/missions")
    public List<Mission> activeMissions() {
        return gamificationService.activeMissions();
    }

    @GetMapping("/missions/progress")
    public List<UserMissionProgress> myProgress(@RequestHeader("X-User-Id") Long userId) {
        return gamificationService.myProgress(userId);
    }

    @PostMapping("/missions/progress")
    public UserMissionProgress incrementProgress(@RequestHeader("X-User-Id") Long userId,
                                                  @Valid @RequestBody MissionProgressRequest request) {
        return gamificationService.incrementProgress(userId, request.missionId(), request.increment());
    }
}
