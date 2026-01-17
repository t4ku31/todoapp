package io.reflectoring.bff.service;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.AnalyticsDto;

@Service
public class BffAnalyticsService {

        private static final Logger log = LoggerFactory.getLogger(BffAnalyticsService.class);
        private final RestClient restClient;
        private final String resourceUrl;

        public BffAnalyticsService(RestClient.Builder builder, AppProperties appProperties) {
                this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
                this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
        }

        public AnalyticsDto.EfficiencyStats getEfficiencyStatsInRange(LocalDate startDate, LocalDate endDate,
                        String token) {
                log.info("Fetching efficiency stats range: {} - {}", startDate, endDate);
                AnalyticsDto.EfficiencyStats stats = restClient.get()
                                .uri(resourceUrl + "/analytics/efficiency/range?startDate={startDate}&endDate={endDate}",
                                                startDate,
                                                endDate)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(AnalyticsDto.EfficiencyStats.class);
                log.info("Efficiency stats range: {}", stats);
                return stats;
        }

        public AnalyticsDto.DailyFocusByCategory[] getDailyFocusByCategory(LocalDate startDate, LocalDate endDate,
                        String token) {
                log.info("Fetching daily focus by category: {} - {}", startDate, endDate);
                AnalyticsDto.DailyFocusByCategory[] data = restClient.get()
                                .uri(resourceUrl + "/analytics/focus-by-category?startDate={startDate}&endDate={endDate}",
                                                startDate,
                                                endDate)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(AnalyticsDto.DailyFocusByCategory[].class);
                log.info("Daily focus by category: {}", (Object) data);
                return data;
        }

        public AnalyticsDto.WeeklyCategoryAggregation getCategoryAggregation(LocalDate startDate, LocalDate endDate,
                        String token) {
                log.info("Fetching category aggregation: {} - {}", startDate, endDate);
                AnalyticsDto.WeeklyCategoryAggregation data = restClient.get()
                                .uri(resourceUrl + "/analytics/category-aggregation?startDate={startDate}&endDate={endDate}",
                                                startDate,
                                                endDate)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(AnalyticsDto.WeeklyCategoryAggregation.class);
                log.info("Category aggregation: {}", data);
                return data;
        }

        public io.reflectoring.bff.dto.FocusSessionDto.Response[] getDailyFocusSessions(LocalDate date, String token) {
                // Note: Assuming FocusSessionController handles this path on Resource Server
                log.info("Fetching daily focus sessions for date: {}", date);
                io.reflectoring.bff.dto.FocusSessionDto.Response[] sessions = restClient.get()
                                .uri(resourceUrl + "/focus-sessions/date/{date}", date)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(io.reflectoring.bff.dto.FocusSessionDto.Response[].class);
                log.info("Daily focus sessions: {}", (Object) sessions);
                return sessions;
        }

        public AnalyticsDto.GroupedTaskSummary[] getTaskSummary(LocalDate startDate, LocalDate endDate, String token) {
                log.info("Fetching task summary for range: {} - {}", startDate, endDate);
                String uri = resourceUrl + "/analytics/task-summary?startDate=" + startDate;
                if (endDate != null) {
                        uri += "&endDate=" + endDate;
                }

                AnalyticsDto.GroupedTaskSummary[] data = restClient.get()
                                .uri(uri)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(AnalyticsDto.GroupedTaskSummary[].class);
                log.info("Task summary: {}", (Object) data);
                return data;
        }

        public AnalyticsDto.DailyGoalWithActual getDailyGoalWithActual(LocalDate date, String token) {
                log.info("Fetching daily goal with actual for date: {}", date);
                AnalyticsDto.DailyGoalWithActual data = restClient.get()
                                .uri(resourceUrl + "/analytics/daily-goals/{date}", date)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(AnalyticsDto.DailyGoalWithActual.class);
                log.info("Daily goal with actual: {}", data);
                return data;
        }

        public io.reflectoring.bff.dto.MonthlyAnalyticsDto getMonthlyAnalytics(String month, String token) {
                log.info("Fetching monthly analytics for month: {}", month);
                io.reflectoring.bff.dto.MonthlyAnalyticsDto data = restClient.get()
                                .uri(resourceUrl + "/analytics/monthly?month={month}", month)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(io.reflectoring.bff.dto.MonthlyAnalyticsDto.class);
                log.info("Monthly analytics: {}", data);
                return data;
        }

        public io.reflectoring.bff.dto.WeeklyAnalyticsDto getWeeklyAnalytics(String startDate, String endDate,
                        String token) {
                log.info("Fetching weekly analytics from {} to {}", startDate, endDate);
                io.reflectoring.bff.dto.WeeklyAnalyticsDto data = restClient.get()
                                .uri(resourceUrl + "/analytics/weekly?startDate={startDate}&endDate={endDate}",
                                                startDate, endDate)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(io.reflectoring.bff.dto.WeeklyAnalyticsDto.class);
                log.info("Weekly analytics: {}", data);
                return data;
        }

        public io.reflectoring.bff.dto.DailyAnalyticsDto getDailyAnalytics(String date, String token) {
                log.info("Fetching daily analytics for date: {}", date);
                io.reflectoring.bff.dto.DailyAnalyticsDto data = restClient.get()
                                .uri(resourceUrl + "/analytics/daily?date={date}", date)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(io.reflectoring.bff.dto.DailyAnalyticsDto.class);
                log.info("Daily analytics: {}", data);
                return data;
        }
}
