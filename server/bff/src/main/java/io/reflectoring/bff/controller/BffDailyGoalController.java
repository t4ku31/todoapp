package io.reflectoring.bff.controller;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.DailyGoalDto;
import io.reflectoring.bff.service.BffDailyGoalService;

@RestController
@RequestMapping("/api/daily-goals")
public class BffDailyGoalController {

    private static final Logger log = LoggerFactory.getLogger(BffDailyGoalController.class);
    private final BffDailyGoalService dailyGoalService;

    public BffDailyGoalController(BffDailyGoalService dailyGoalService) {
        this.dailyGoalService = dailyGoalService;
    }

    @GetMapping("/{date}")
    public ResponseEntity<DailyGoalDto.Response> getGoal(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/daily-goals/{}] Request by user: {}", date, client.getPrincipalName());
        try {
            DailyGoalDto.Response response = dailyGoalService.getGoal(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(response);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{date}/with-actual")
    public ResponseEntity<DailyGoalDto.WithActual> getGoalWithActual(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/daily-goals/{}/with-actual] Request by user: {}", date, client.getPrincipalName());
        try {
            DailyGoalDto.WithActual response = dailyGoalService.getGoalWithActual(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(response);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/daily-goals/{}/with-actual] Error: {}", date, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/daily-goals/{}/with-actual] Error: {}", date, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{date}")
    public ResponseEntity<DailyGoalDto.Response> setGoal(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody DailyGoalDto.Request request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[PUT /api/daily-goals/{}] Request by user: {} with {} minutes",
                date, client.getPrincipalName(), request.goalMinutes());
        try {
            DailyGoalDto.Response response = dailyGoalService.setGoal(
                    date, request, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(response);
        } catch (RestClientResponseException e) {
            log.error("[PUT /api/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[PUT /api/daily-goals/{}] Error: {}", date, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/range")
    public ResponseEntity<List<DailyGoalDto.WithActual>> getGoalsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/daily-goals/range] Request by user: {} from {} to {}",
                client.getPrincipalName(), startDate, endDate);
        try {
            List<DailyGoalDto.WithActual> response = dailyGoalService.getGoalsInRange(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(response);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/daily-goals/range] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/daily-goals/range] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
