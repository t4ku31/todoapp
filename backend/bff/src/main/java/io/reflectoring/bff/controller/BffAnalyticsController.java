package io.reflectoring.bff.controller;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.AnalyticsDto;
import io.reflectoring.bff.service.BffAnalyticsService;

@RestController
@RequestMapping("/api/analytics")
public class BffAnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(BffAnalyticsController.class);
    private final BffAnalyticsService analyticsService;

    public BffAnalyticsController(BffAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/daily-goals/{date}")
    public ResponseEntity<AnalyticsDto.DailyGoalWithActual> getDailyGoalWithActual(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/daily-goals/{}] Request by user: {}", date, client.getPrincipalName());
        try {
            AnalyticsDto.DailyGoalWithActual data = analyticsService.getDailyGoalWithActual(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/efficiency/range")
    public ResponseEntity<AnalyticsDto.EfficiencyStats> getEfficiencyStatsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/efficiency/range] Request by user: {} from {} to {}",
                client.getPrincipalName(), startDate, endDate);
        try {
            AnalyticsDto.EfficiencyStats stats = analyticsService.getEfficiencyStatsInRange(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(stats);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/efficiency/range] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/efficiency/range] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/focus-by-category")
    public ResponseEntity<AnalyticsDto.DailyFocusByCategory[]> getDailyFocusByCategory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/focus-by-category] Request by user: {} from {} to {}",
                client.getPrincipalName(), startDate, endDate);
        try {
            AnalyticsDto.DailyFocusByCategory[] data = analyticsService.getDailyFocusByCategory(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/focus-by-category] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/focus-by-category] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/category-aggregation")
    public ResponseEntity<AnalyticsDto.WeeklyCategoryAggregation> getCategoryAggregation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/category-aggregation] Request by user: {} from {} to {}",
                client.getPrincipalName(), startDate, endDate);
        try {
            AnalyticsDto.WeeklyCategoryAggregation data = analyticsService.getCategoryAggregation(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/category-aggregation] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/category-aggregation] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/task-summary")
    public ResponseEntity<AnalyticsDto.GroupedTaskSummary[]> getTaskSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/task-summary] Request by user: {} range: {} - {}", client.getPrincipalName(),
                startDate, endDate);
        try {
            AnalyticsDto.GroupedTaskSummary[] data = analyticsService.getTaskSummary(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/task-summary] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/task-summary] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/focus-sessions/{date}")
    public ResponseEntity<io.reflectoring.bff.dto.FocusSessionDto.Response[]> getDailyFocusSessions(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/focus-sessions/{}] Request by user: {}", date, client.getPrincipalName());
        try {
            io.reflectoring.bff.dto.FocusSessionDto.Response[] sessions = analyticsService.getDailyFocusSessions(
                    date, client.getAccessToken().getTokenValue());

            return ResponseEntity.ok(sessions);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/focus-sessions/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/focus-sessions/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/monthly")
    public ResponseEntity<AnalyticsDto.MonthlyAnalyticsDto> getMonthlyAnalytics(
            @RequestParam String month,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/monthly?month={}] Request by user: {}", month, client.getPrincipalName());
        try {
            AnalyticsDto.MonthlyAnalyticsDto data = analyticsService.getMonthlyAnalytics(
                    month, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/monthly] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/monthly] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/weekly")
    public ResponseEntity<AnalyticsDto.WeeklyAnalyticsDto> getWeeklyAnalytics(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/weekly?startDate={}&endDate={}] Request by user: {}",
                startDate, endDate, client.getPrincipalName());
        try {
            AnalyticsDto.WeeklyAnalyticsDto data = analyticsService.getWeeklyAnalytics(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/weekly] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/weekly] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/daily")
    public ResponseEntity<AnalyticsDto.DailyAnalyticsDto> getDailyAnalytics(
            @RequestParam String date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/analytics/daily?date={}] Request by user: {}", date, client.getPrincipalName());
        try {
            AnalyticsDto.DailyAnalyticsDto data = analyticsService.getDailyAnalytics(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(data);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/analytics/daily] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/analytics/daily] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
