package com.example.app1.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.domain.PomodoroSetting;
import com.example.app1.service.domain.PomodoroSettingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/settings/pomodoro")
@RequiredArgsConstructor
@Slf4j
public class PomodoroSettingController {

    private final PomodoroSettingService service;

    @GetMapping
    public PomodoroSetting getSettings(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Fetching pomodoro settings for user: {}", userId);
        return service.getSettings(userId);
    }

    @PatchMapping
    public PomodoroSetting updateSettings(@AuthenticationPrincipal Jwt jwt, @RequestBody PomodoroSetting settings) {
        String userId = jwt.getSubject();
        log.info("Updating pomodoro settings for user: {}", userId);
        return service.updateSettings(userId, settings);
    }
}
