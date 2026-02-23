package io.reflectoring.bff.service;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.FocusSessionDto;

@Service
public class BffFocusSessionService {

    private static final Logger log = LoggerFactory.getLogger(BffFocusSessionService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffFocusSessionService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public FocusSessionDto.Response recordSession(FocusSessionDto.RecordRequest request, String token) {
        log.info("Recording session: type={}, status={}, duration={}", request.getSessionType(), request.getStatus(),
                request.getActualDuration());
        FocusSessionDto.Response response = restClient.post()
                .uri(resourceUrl + "/focus-sessions/record")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .retrieve()
                .body(FocusSessionDto.Response.class);
        log.info("Successfully recorded session: {}", response);
        return response;
    }

    public FocusSessionDto.EfficiencyStats getEfficiencyStats(LocalDate date, String token) {
        log.info("Fetching efficiency stats for date: {}", date);
        FocusSessionDto.EfficiencyStats stats = restClient.get()
                .uri(resourceUrl + "/focus-sessions/efficiency/{date}", date)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(FocusSessionDto.EfficiencyStats.class);
        log.info("Efficiency stats: {}", stats);
        return stats;
    }

    public FocusSessionDto.DailySummary getDailySummary(LocalDate date, String token) {
        log.info("Fetching daily summary for date: {}", date);
        FocusSessionDto.DailySummary summary = restClient.get()
                .uri(resourceUrl + "/focus-sessions/daily?date={date}", date)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(FocusSessionDto.DailySummary.class);
        log.info("Daily summary: {} seconds", summary != null ? summary.totalSeconds() : 0);
        return summary;
    }

    public FocusSessionDto.TotalSummary getTotalSummary(String token) {
        log.info("Fetching total summary");
        FocusSessionDto.TotalSummary summary = restClient.get()
                .uri(resourceUrl + "/focus-sessions/total")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(FocusSessionDto.TotalSummary.class);
        log.info("Total summary: {} seconds", summary != null ? summary.totalSeconds() : 0);
        return summary;
    }

    public FocusSessionDto.WeeklySummary getWeeklySummary(LocalDate date, String token) {
        log.info("Fetching weekly summary for date: {}", date);
        FocusSessionDto.WeeklySummary summary = restClient.get()
                .uri(resourceUrl + "/focus-sessions/weekly/{date}", date)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(FocusSessionDto.WeeklySummary.class);
        log.info("Weekly summary: {} seconds", summary != null ? summary.totalSeconds() : 0);
        return summary;
    }
}
