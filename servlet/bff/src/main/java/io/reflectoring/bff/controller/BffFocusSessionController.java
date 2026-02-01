package io.reflectoring.bff.controller;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.FocusSessionDto;
import io.reflectoring.bff.service.BffFocusSessionService;

@RestController
@RequestMapping("/api/focus-sessions")
public class BffFocusSessionController {

    private static final Logger log = LoggerFactory.getLogger(BffFocusSessionController.class);
    private final BffFocusSessionService focusSessionService;

    public BffFocusSessionController(BffFocusSessionService focusSessionService) {
        this.focusSessionService = focusSessionService;
    }

    @PostMapping("/record")
    public ResponseEntity<FocusSessionDto.Response> recordSession(
            @RequestBody FocusSessionDto.RecordRequest request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/focus-sessions/record] Request by user: {}", client.getPrincipalName());
        try {
            FocusSessionDto.Response response = focusSessionService.recordSession(
                    request, client.getAccessToken().getTokenValue());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RestClientResponseException e) {
            log.error("[POST /api/focus-sessions/record] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[POST /api/focus-sessions/record] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/efficiency/{date}")
    public ResponseEntity<FocusSessionDto.EfficiencyStats> getEfficiencyStats(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/focus-sessions/efficiency/{}] Request by user: {}", date, client.getPrincipalName());
        try {
            FocusSessionDto.EfficiencyStats stats = focusSessionService.getEfficiencyStats(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(stats);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/focus-sessions/efficiency] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/focus-sessions/efficiency] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/daily")
    public ResponseEntity<FocusSessionDto.DailySummary> getDailySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/focus-sessions/daily] Request by user: {} for date: {}",
                client.getPrincipalName(), date);
        try {
            FocusSessionDto.DailySummary summary = focusSessionService.getDailySummary(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(summary);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/focus-sessions/daily] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/focus-sessions/daily] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/total")
    public ResponseEntity<FocusSessionDto.TotalSummary> getTotalSummary(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/focus-sessions/total] Request by user: {}", client.getPrincipalName());
        try {
            FocusSessionDto.TotalSummary summary = focusSessionService.getTotalSummary(
                    client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(summary);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/focus-sessions/total] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/focus-sessions/total] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/weekly/{date}")
    public ResponseEntity<FocusSessionDto.WeeklySummary> getWeeklySummary(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/focus-sessions/weekly/{}] Request by user: {}", date, client.getPrincipalName());
        try {
            FocusSessionDto.WeeklySummary summary = focusSessionService.getWeeklySummary(
                    date, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(summary);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/focus-sessions/weekly] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/focus-sessions/weekly] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
