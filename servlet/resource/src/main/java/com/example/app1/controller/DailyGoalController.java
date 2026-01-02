package com.example.app1.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.DailyGoalDto;
import com.example.app1.model.DailyGoal;
import com.example.app1.service.domain.DailyGoalService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Daily Goal operations.
 * Manages daily focus time targets.
 */
@Slf4j
@RestController
@RequestMapping("/api/daily-goals")
@RequiredArgsConstructor
public class DailyGoalController {

    private final DailyGoalService dailyGoalService;

    /**
     * Get goal for a specific date.
     */
    @GetMapping("/{date}")
    public ResponseEntity<DailyGoalDto.Response> getGoal(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting goal for user {} on date {}", userId, date);

        DailyGoalDto.Response response = dailyGoalService.getGoal(userId, date);
        return ResponseEntity.ok(response);
    }

    /**
     * Set goal for a specific date.
     */
    @PutMapping("/{date}")
    public ResponseEntity<DailyGoal> setGoal(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody @Valid DailyGoalDto.Request request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Setting goal for user {} on date {} to {} minutes", userId, date, request.goalMinutes());

        DailyGoal response = dailyGoalService.setGoal(userId, date, request);
        return ResponseEntity.ok(response);
    }
}
