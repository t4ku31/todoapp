package io.reflectoring.bff.service;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.DailyGoalDto;

@Service
public class BffDailyGoalService {

    private static final Logger log = LoggerFactory.getLogger(BffDailyGoalService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffDailyGoalService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public DailyGoalDto.Response getGoal(LocalDate date, String token) {
        log.info("Fetching goal for date: {}", date);
        DailyGoalDto.Response response = restClient.get()
                .uri(resourceUrl + "/daily-goals/{date}", date)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(DailyGoalDto.Response.class);
        log.info("Got goal: {} minutes", response != null ? response.goalMinutes() : null);
        return response;
    }

    public DailyGoalDto.WithActual getGoalWithActual(LocalDate date, String token) {
        log.info("Fetching goal with actual for date: {}", date);
        DailyGoalDto.WithActual response = restClient.get()
                .uri(resourceUrl + "/analytics/daily-goals/{date}", date)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(DailyGoalDto.WithActual.class);
        log.info("Got goal with actual: {} / {} minutes",
                response != null ? response.actualMinutes() : null,
                response != null ? response.goalMinutes() : null);
        return response;
    }

    public DailyGoalDto.Response setGoal(LocalDate date, DailyGoalDto.Request request, String token) {
        log.info("Setting goal for date {} to {} minutes", date, request.goalMinutes());
        DailyGoalDto.Response response = restClient.put()
                .uri(resourceUrl + "/daily-goals/{date}", date)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .retrieve()
                .body(DailyGoalDto.Response.class);
        log.info("Set goal successfully: {}", response);
        return response;
    }

    public List<DailyGoalDto.WithActual> getGoalsInRange(LocalDate startDate, LocalDate endDate, String token) {
        log.info("Fetching goals from {} to {}", startDate, endDate);
        List<DailyGoalDto.WithActual> response = restClient.get()
                .uri(resourceUrl + "/analytics/daily-goals/range?startDate={start}&endDate={end}", startDate, endDate)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<DailyGoalDto.WithActual>>() {
                });
        log.info("Got {} goals in range", response != null ? response.size() : 0);
        return response;
    }
}
