package com.example.app1.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.FocusSessionDto;
import com.example.app1.model.FocusSession;
import com.example.app1.service.domain.FocusSessionService;

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
     * Record a focus session.
     */
    @PostMapping("/record")
    public ResponseEntity<FocusSessionDto.Response> recordSession(
            @RequestBody FocusSessionDto.RecordRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to record session for user: {}", userId);

        FocusSession session = focusSessionService.recordSession(request, userId);

        FocusSessionDto.Response response = FocusSessionDto.Response.builder()
                .id(session.getId())
                .taskId(session.getTaskId())
                .sessionType(session.getSessionType().name())
                .status(session.getStatus().name())
                .scheduledDuration(session.getScheduledDuration())
                .actualDuration(session.getActualDuration())
                .startedAt(session.getStartedAt())
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

    @GetMapping("/weekly/{date}")
    public ResponseEntity<FocusSessionDto.WeeklySummary> getWeeklySummary(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request for weekly summary for user: {} on date: {}", userId, date);

        FocusSessionDto.WeeklySummary summary = focusSessionService.getWeeklySummary(userId, date);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<java.util.List<FocusSessionDto.Response>> getSessionsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request for sessions for user: {} on date: {}", userId, date);

        java.util.List<FocusSession> sessions = focusSessionService.getSessionsByDate(userId, date);
        java.util.List<FocusSessionDto.Response> response = sessions.stream()
                .map(session -> {
                    var task = session.getTask();
                    var category = task != null ? task.getCategory() : null;
                    return FocusSessionDto.Response.builder()
                            .id(session.getId())
                            .taskId(session.getTaskId())
                            .taskTitle(task != null ? task.getTitle() : null)
                            .categoryName(category != null ? category.getName() : null)
                            .categoryColor(category != null ? category.getColor() : null)
                            .sessionType(session.getSessionType().name())
                            .status(session.getStatus().name())
                            .scheduledDuration(session.getScheduledDuration())
                            .actualDuration(session.getActualDuration())
                            .startedAt(session.getStartedAt())
                            .endedAt(session.getEndedAt())
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());

        log.info("Returning sessions {}", response);
        return ResponseEntity.ok(response);
    }
}
