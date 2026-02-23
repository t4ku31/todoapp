package com.todoapp.resource.controller;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.todoapp.resource.dto.AnalyticsDto;
import com.todoapp.resource.service.usecase.AnalyticsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Analytics operations.
 * Exposes endpoints for aggregated data (Daily Goals + Focus Sessions).
 */
@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get daily goal with actual focus time.
     */
    @GetMapping("/daily-goals/{date}")
    public ResponseEntity<AnalyticsDto.DailyGoalWithActual> getDailyGoalWithActual(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting goal with actual for user {} on date {}", userId, date);

        AnalyticsDto.DailyGoalWithActual response = analyticsService.getDailyGoalWithActual(userId, date);
        return ResponseEntity.ok(response);
    }

    /**
     * Get daily goals with actual focus time for a date range.
     */
    @GetMapping("/daily-goals/range")
    public ResponseEntity<List<AnalyticsDto.DailyGoalWithActual>> getDailyGoalsWithActualInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting daily goals with actual for user {} from {} to {}", userId, startDate, endDate);

        List<AnalyticsDto.DailyGoalWithActual> response = analyticsService.getDailyGoalsWithActualInRange(userId,
                startDate, endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get Efficiency Stats for a date range.
     */
    @GetMapping("/efficiency/range")
    public ResponseEntity<AnalyticsDto.EfficiencyStats> getEfficiencyStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        OffsetDateTime startDateTime = startDate.atStartOfDay().atOffset(java.time.ZoneOffset.UTC);
        OffsetDateTime endDateTime = endDate.plusDays(1).atStartOfDay().atOffset(java.time.ZoneOffset.UTC);
        log.info("Getting efficiency stats for user {} from {} to {}", userId, startDateTime, endDateTime);

        AnalyticsDto.EfficiencyStats stats = analyticsService.getEfficiencyStats(userId, startDateTime, endDateTime);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get daily focus breakdown by category for a date range.
     */
    @GetMapping("/focus-by-category")
    public ResponseEntity<List<AnalyticsDto.DailyFocusByCategory>> getDailyFocusByCategory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting daily focus by category for user {} from {} to {}", userId, startDate, endDate);

        List<AnalyticsDto.DailyFocusByCategory> response = analyticsService.getDailyFocusByCategory(userId, startDate,
                endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get category aggregation for a date range.
     */
    @GetMapping("/category-aggregation")
    public ResponseEntity<AnalyticsDto.WeeklyCategoryAggregation> getCategoryAggregation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting category aggregation for user {} from {} to {}", userId, startDate, endDate);

        AnalyticsDto.WeeklyCategoryAggregation response = analyticsService.getCategoryAggregation(userId, startDate,
                endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get task summary for a date range (Daily or Weekly).
     * Returns grouped task summaries where recurring tasks are aggregated.
     */
    @GetMapping("/task-summary")
    public ResponseEntity<List<AnalyticsDto.GroupedTaskSummary>> getTaskSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        // If only startDate is provided, assume single day range (start + 24h) handled
        // by service or client should provide end
        // But for task summary, typically a range is expected. If endDate is null,
        // let's defer defaults to client or service.
        // For now, if endDate is null, we can default to startDate + 1 day logic in
        // service if needed,
        // but typically client should send both.
        if (endDate == null) {
            endDate = startDate.plusDays(1);
        }
        log.info("Getting task summary for user {} from {} to {}", userId, startDate, endDate);

        List<AnalyticsDto.GroupedTaskSummary> response = analyticsService.getTaskSummary(userId, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get monthly analytics for a specific month.
     * 
     * @param month Month in format yyyy-MM (e.g., 2024-01)
     */
    @GetMapping("/monthly")
    public ResponseEntity<AnalyticsDto.MonthlyAnalyticsDto> getMonthlyAnalytics(
            @RequestParam String month,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();

        // Parse month parameter (yyyy-MM)
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthValue = Integer.parseInt(parts[1]);

        log.info("Getting monthly analytics for user {} for {}-{}", userId, year, monthValue);

        AnalyticsDto.MonthlyAnalyticsDto response = analyticsService.getMonthlyAnalytics(userId, year,
                monthValue);
        log.info("Monthly analytics for user {}: {}", userId, response);
        return ResponseEntity.ok(response);
    }

    /**
     * Get consolidated weekly analytics data.
     * Returns all data needed for the Weekly view in a single response.
     */
    @GetMapping("/weekly")
    public ResponseEntity<AnalyticsDto.WeeklyAnalyticsDto> getWeeklyAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting weekly analytics for user {} from {} to {}", userId, startDate, endDate);

        AnalyticsDto.WeeklyAnalyticsDto response = analyticsService.getWeeklyAnalytics(userId, startDate,
                endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get consolidated daily analytics data.
     * Returns all data needed for the Daily view in a single response.
     */
    @GetMapping("/daily")
    public ResponseEntity<AnalyticsDto.DailyAnalyticsDto> getDailyAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime date,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Getting daily analytics for user {} on {}", userId, date); // Note: 'date' param here refers to start
                                                                             // of the day in user's timezone

        AnalyticsDto.DailyAnalyticsDto response = analyticsService.getDailyAnalytics(userId, date);
        return ResponseEntity.ok(response);
    }
}
