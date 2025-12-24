package com.example.app1.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.FocusSessionDto;
import com.example.app1.model.FocusSession;
import com.example.app1.service.FocusSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Focus Session operations.
 * Tracks focus time for analytics.
 */
@Slf4j
@RestController
@RequestMapping("/api/focus-sessions")
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService focusSessionService;

    /**
     * Add focus time to an existing session or create a new one.
     */
    @PostMapping
    public ResponseEntity<FocusSessionDto.Response> addFocusTime(
            @RequestBody FocusSessionDto.AddRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to add focus time for user: {}", userId);

        FocusSession session = focusSessionService.addFocusTime(request, userId);

        FocusSessionDto.Response response = FocusSessionDto.Response.builder()
                .id(session.getId())
                .taskId(session.getTaskId())
                .date(session.getDate())
                .durationSeconds(session.getDurationSeconds())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get daily focus time summary.
     */
    @GetMapping("/daily")
    public ResponseEntity<FocusSessionDto.DailySummary> getDailySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request for daily summary for user: {} on date: {}", userId, date);

        FocusSessionDto.DailySummary summary = focusSessionService.getDailySummary(userId, date);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get total focus time summary (all time).
     */
    @GetMapping("/total")
    public ResponseEntity<FocusSessionDto.TotalSummary> getTotalSummary(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request for total summary for user: {}", userId);

        FocusSessionDto.TotalSummary summary = focusSessionService.getTotalSummary(userId);
        return ResponseEntity.ok(summary);
    }
}
