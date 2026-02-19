package com.example.app1.service.usecase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.app1.dto.AnalyticsDto;
import com.example.app1.dto.AnalyticsDto.EfficiencyStats;
import com.example.app1.dto.DailyGoalDto;
import com.example.app1.model.FocusSession;
import com.example.app1.model.Task;
import com.example.app1.repository.FocusSessionRepository;
import com.example.app1.repository.TaskRepository;
import com.example.app1.service.domain.DailyGoalService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for Analytics and Dashboard use cases.
 * Aggregates data from Daily Goals and Focus Sessions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

        private final DailyGoalService dailyGoalService;
        private final FocusSessionRepository focusSessionRepository;
        private final TaskRepository taskRepository;
        private final com.example.app1.repository.PomodoroSettingRepository pomodoroSettingRepository;
        private final AnalyticsCalculator calculator;
        private final AnalyticsAggregator aggregator;

        // --- Public API Methods ---

        /**
         * Get goal with actual focus time for a specific date.
         */
        public AnalyticsDto.DailyGoalWithActual getDailyGoalWithActual(String userId, LocalDate date) {
                DailyGoalDto.Response goal = dailyGoalService.getGoal(userId, date);
                return createDailyGoalWithActual(userId, goal);
        }

        /**
         * Get weekly goals with actuals in range.
         */
        public List<AnalyticsDto.DailyGoalWithActual> getDailyGoalsWithActualInRange(String userId, LocalDate startDate,
                        LocalDate endDate) {
                List<DailyGoalDto.Response> goals = dailyGoalService.getGoalsInRange(userId, startDate, endDate);

                // Batch fetch focus minutes
                List<FocusSessionRepository.DailyFocusProjection> dailyTotals = focusSessionRepository
                                .aggregateDailyFocusMinutes(userId, startDate.atStartOfDay(),
                                                endDate.plusDays(1).atStartOfDay());
                Map<LocalDate, Long> dailyTotalMap = dailyTotals.stream()
                                .collect(Collectors.toMap(
                                                FocusSessionRepository.DailyFocusProjection::getDate,
                                                FocusSessionRepository.DailyFocusProjection::getMinutes));

                return goals.stream()
                                .map(goal -> {
                                        int actualMinutes = dailyTotalMap.getOrDefault(goal.date(), 0L).intValue();
                                        int goalMinutes = goal.goalMinutes();
                                        double percentage = goalMinutes > 0 ? (actualMinutes * 100.0 / goalMinutes) : 0;
                                        return new AnalyticsDto.DailyGoalWithActual(goal.date(), goalMinutes,
                                                        actualMinutes, percentage);
                                })
                                .toList();
        }

        /**
         * Get monthly analytics data including KPIs, heatmap data, and resource
         * allocation.
         */
        /**
         * Get monthly analytics data including KPIs, heatmap data, and resource
         * allocation.
         */
        public AnalyticsDto.MonthlyAnalyticsDto getMonthlyAnalytics(String userId, int year, int month) {
                log.info("Getting monthly analytics for user {} for {}-{}", userId, year, month);

                LocalDate startOfMonth = LocalDate.of(year, month, 1);
                LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());
                LocalDateTime start = startOfMonth.atStartOfDay();
                LocalDateTime end = endOfMonth.atTime(LocalTime.MAX);

                // Optimized focus days count using SQL
                int focusDays = focusSessionRepository.countFocusDaysByUserIdAndDateRange(userId, start, end);

                OffsetDateTime startOffset = startOfMonth.atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
                OffsetDateTime endOffset = startOffset.plusMonths(1);
                OffsetDateTime prevStartOffset = startOffset.minusMonths(1);
                OffsetDateTime prevEndOffset = prevStartOffset.plusMonths(1);

                AnalyticsDto.KpiData kpi = calculateKpiData(userId, startOffset, endOffset, prevStartOffset,
                                prevEndOffset);

                List<FocusSessionRepository.DailyFocusProjection> dailyTotals = focusSessionRepository
                                .aggregateDailyFocusMinutes(userId, start, end);
                Map<LocalDate, Long> dailyTotalMap = dailyTotals.stream()
                                .collect(Collectors.toMap(
                                                FocusSessionRepository.DailyFocusProjection::getDate,
                                                FocusSessionRepository.DailyFocusProjection::getMinutes));

                List<AnalyticsDto.MonthlyAnalyticsDto.DayActivity> dailyActivity = startOfMonth
                                .datesUntil(endOfMonth.plusDays(1))
                                .map(date -> new AnalyticsDto.MonthlyAnalyticsDto.DayActivity(
                                                date.toString(),
                                                dailyTotalMap.getOrDefault(date, 0L)))
                                .toList();

                return AnalyticsDto.MonthlyAnalyticsDto.builder()
                                .kpi(kpi)
                                .focusDays(focusDays)
                                .dailyAverageFocusMinutes(
                                                focusDays > 0 ? (double) kpi.totalFocusMinutes() / focusDays : 0)
                                .dailyActivity(dailyActivity)
                                .categoryAggregation(partitionByCategoryByWeek(userId, startOfMonth, endOfMonth))
                                .build();
        }

        /**
         * Get consolidated weekly analytics data for the Weekly view.
         */
        public AnalyticsDto.WeeklyAnalyticsDto getWeeklyAnalytics(String userId, OffsetDateTime startDate,
                        OffsetDateTime endDate) {
                log.info("Getting weekly analytics for user {} from {} to {}", userId, startDate, endDate);

                AnalyticsDto.KpiData kpi = calculateKpiData(userId, startDate, endDate, startDate.minusWeeks(1),
                                startDate);

                long daysInRange = ChronoUnit.DAYS.between(startDate, endDate);
                double dailyAverage = daysInRange > 0 ? (double) kpi.totalFocusMinutes() / daysInRange : 0;

                return AnalyticsDto.WeeklyAnalyticsDto.builder()
                                .kpi(kpi)
                                .dailyAverageFocusMinutes(dailyAverage)
                                .dailyFocusData(getDailyFocusByCategory(userId, startDate, endDate))
                                .categoryAggregation(fetchCategoryAggregation(userId, startDate.toLocalDateTime(),
                                                endDate.toLocalDateTime()))
                                .taskSummaries(getTaskSummary(userId, startDate, endDate))
                                .build();
        }

        /**
         * Get consolidated daily analytics data for the Daily view.
         */
        public AnalyticsDto.DailyAnalyticsDto getDailyAnalytics(String userId, OffsetDateTime date) {
                log.info("Getting daily analytics for user {} on {}", userId, date);

                OffsetDateTime endOffset = date.plusDays(1);
                AnalyticsDto.KpiData kpi = calculateKpiData(userId, date, endOffset, date.minusDays(1), date);

                List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(
                                userId, date.toLocalDateTime(), endOffset.toLocalDateTime());

                return AnalyticsDto.DailyAnalyticsDto.builder()
                                .kpi(kpi)
                                .taskSummaries(fetchAndBuildTaskSummaries(userId, date, endOffset))
                                .focusSessions(aggregator.mapToFocusSessionData(sessions))
                                .build();
        }

        // --- Helper Logic for Internal Use ---

        /**
         * Creates a DailyGoalWithActual DTO by combining goal data with actual focus
         * minutes.
         * Calculates the achievement percentage based on goal and actual values.
         */
        private AnalyticsDto.DailyGoalWithActual createDailyGoalWithActual(String userId, DailyGoalDto.Response goal) {
                Integer totalMinutes = focusSessionRepository.getTotalFocusMinutesByUserIdAndDateRange(userId,
                                goal.date().atStartOfDay(), goal.date().plusDays(1).atStartOfDay());
                int actualMinutes = totalMinutes != null ? totalMinutes : 0;
                Integer goalMinutes = goal.goalMinutes();
                double percentage = goalMinutes > 0 ? (actualMinutes * 100.0 / goalMinutes) : 0;

                return new AnalyticsDto.DailyGoalWithActual(goal.date(), goalMinutes, actualMinutes, percentage);
        }

        /**
         * Partition focus sessions into weekly chunks for monthly category aggregation
         * using SQL.
         */
        private Map<String, List<AnalyticsDto.CategoryFocusTime>> partitionByCategoryByWeek(String userId,
                        LocalDate startOfMonth,
                        LocalDate endOfMonth) {
                Map<String, List<AnalyticsDto.CategoryFocusTime>> result = new LinkedHashMap<>();
                int weekNum = 1;
                LocalDate weekStart = startOfMonth;

                while (!weekStart.isAfter(endOfMonth)) {
                        LocalDate weekEnd = weekStart.plusDays(6);
                        if (weekEnd.isAfter(endOfMonth))
                                weekEnd = endOfMonth;

                        List<AnalyticsDto.CategoryFocusTime> weekAggregation = fetchCategoryAggregation(userId,
                                        weekStart.atStartOfDay(), weekEnd.atTime(LocalTime.MAX));

                        result.put("Week " + weekNum, weekAggregation);
                        weekStart = weekEnd.plusDays(1);
                        weekNum++;
                }
                return result;
        }

        /**
         * Fetches and aggregates focus time by category for a given date range.
         * Maps database projections to DTOs.
         */
        private List<AnalyticsDto.CategoryFocusTime> fetchCategoryAggregation(String userId, LocalDateTime start,
                        LocalDateTime end) {
                return focusSessionRepository.aggregateCategoryFocusTime(userId, start, end).stream()
                                .map(p -> new AnalyticsDto.CategoryFocusTime(
                                                "Uncategorized".equals(p.getCategoryName()) ? null : p.getCategoryId(),
                                                p.getCategoryName(),
                                                p.getCategoryColor(),
                                                p.getMinutes()))
                                .toList();
        }

        /**
         * Get category aggregation for a date range.
         */
        public AnalyticsDto.WeeklyCategoryAggregation getCategoryAggregation(String userId, OffsetDateTime start,
                        OffsetDateTime end) {
                List<AnalyticsDto.CategoryFocusTime> categories = fetchCategoryAggregation(userId,
                                start.toLocalDateTime(),
                                end.toLocalDateTime());
                int totalMinutes = categories.stream().mapToInt(AnalyticsDto.CategoryFocusTime::minutes).sum();

                return new AnalyticsDto.WeeklyCategoryAggregation(
                                start.toLocalDate(),
                                end.toLocalDate(),
                                totalMinutes,
                                categories);
        }

        /**
         * Helper to calculate unified KPI Data (Efficiency, Growth, Estimation) for a
         * range.
         */
        private AnalyticsDto.KpiData calculateKpiData(String userId, OffsetDateTime start, OffsetDateTime end,
                        OffsetDateTime prevStart, OffsetDateTime prevEnd) {

                int totalMins = fetchTotalFocusMinutes(userId, start.toLocalDateTime(), end.toLocalDateTime());
                int prevMins = fetchTotalFocusMinutes(userId, prevStart.toLocalDateTime(), prevEnd.toLocalDateTime());

                EfficiencyStats efficiency = getEfficiencyStats(userId, start, end);
                int tasksCompleted = taskRepository.countCompletedByUserIdAndScheduledStartAtBetween(userId, start,
                                end);
                int tasksTotal = taskRepository.countByUserIdAndScheduledStartAtBetween(userId, start, end);

                int prevTasksCompleted = taskRepository.countCompletedByUserIdAndScheduledStartAtBetween(userId,
                                prevStart,
                                prevEnd);
                int prevTasksTotal = taskRepository.countByUserIdAndScheduledStartAtBetween(userId, prevStart, prevEnd);

                double currentRate = calculator.calculateCompletionRate(tasksCompleted, tasksTotal);
                double prevRate = calculator.calculateCompletionRate(prevTasksCompleted, prevTasksTotal);
                double rateGrowth = prevRate > 0 ? ((currentRate - prevRate) / prevRate) * 100 : 0;

                EstimationStats est = calculateEstimationStats(userId, start, end);

                return new AnalyticsDto.KpiData(
                                totalMins,
                                tasksCompleted,
                                tasksTotal,
                                efficiency.efficiencyScore(),
                                efficiency.rhythmQuality(),
                                efficiency.volumeBalance(),
                                totalMins - prevMins,
                                rateGrowth,
                                est.estimatedMinutes,
                                est.actualMinutes);
        }

        private int fetchTotalFocusMinutes(String userId, LocalDateTime start, LocalDateTime end) {
                Integer minutes = focusSessionRepository.getTotalFocusMinutesByUserIdAndDateRange(userId, start, end);
                return minutes != null ? minutes : 0;
        }

        private record EstimationStats(int estimatedMinutes, int actualMinutes) {
        }

        /**
         * Calculates estimation statistics (Estimated vs Actual) for a given range.
         * Uses the user's Pomodoro setting for duration calculation.
         */
        private EstimationStats calculateEstimationStats(String userId, OffsetDateTime start, OffsetDateTime end) {
                int focusDuration = pomodoroSettingRepository.findByUserId(userId)
                                .map(s -> s.getFocusDuration())
                                .orElse(25);

                int estimated = taskRepository.sumEstimatedPomodorosByUserIdAndScheduledStartAtBetween(userId, start,
                                end) * focusDuration;
                int actual = focusSessionRepository.sumActualDurationForCompletedTasksWithEstimation(userId, start, end)
                                / 60;

                return new EstimationStats(estimated, actual);
        }

        // --- Delegated Methods ---

        /**
         * Calculates Efficiency Stats including Efficiency Score, Rhythm Quality, and
         * Volume Balance.
         */
        public AnalyticsDto.EfficiencyStats getEfficiencyStats(String userId, OffsetDateTime startDate,
                        OffsetDateTime endDate) {
                LocalDateTime start = startDate.toLocalDateTime();
                LocalDateTime end = endDate.toLocalDateTime();

                Long completedSessions = focusSessionRepository.countCompletedSessions(userId, start, end);
                Long totalSessions = focusSessionRepository.countTotalSessions(userId, start, end);
                double rhythmQuality = calculator.calculateRhythmQuality(
                                completedSessions != null ? completedSessions : 0,
                                totalSessions != null ? totalSessions : 0);

                Integer focusMinutes = focusSessionRepository.getTotalFocusMinutesByUserIdAndDateRange(userId, start,
                                end);
                List<DailyGoalDto.Response> goals = dailyGoalService.getGoalsInRange(userId, startDate.toLocalDate(),
                                endDate.minusNanos(1).toLocalDate());
                int goalMinutes = goals.stream().mapToInt(DailyGoalDto.Response::goalMinutes).sum();
                double volumeBalance = calculator.calculateVolumeBalance(focusMinutes != null ? focusMinutes : 0,
                                goalMinutes);

                return EfficiencyStats.builder()
                                .efficiencyScore(calculator.calculateEfficiencyScore(rhythmQuality, volumeBalance))
                                .rhythmQuality(rhythmQuality)
                                .volumeBalance(volumeBalance)
                                .build();
        }

        /**
         * Retrieves daily focus breakdown by category for a given date range.
         * Optimized to use batch fetching for goals and category aggregations.
         */
        public List<AnalyticsDto.DailyFocusByCategory> getDailyFocusByCategory(String userId, OffsetDateTime startDate,
                        OffsetDateTime endDate) {
                LocalDate start = startDate.toLocalDate();
                LocalDate end = endDate.minusNanos(1).toLocalDate();

                List<DailyGoalDto.Response> goals = dailyGoalService.getGoalsInRange(userId, start, end);
                Map<LocalDate, Integer> goalMap = goals.stream()
                                .collect(Collectors.toMap(DailyGoalDto.Response::date,
                                                DailyGoalDto.Response::goalMinutes));

                List<FocusSessionRepository.DailyCategoryFocusProjection> aggregations = focusSessionRepository
                                .aggregateDailyCategoryFocusTime(userId, start.atStartOfDay(),
                                                end.plusDays(1).atStartOfDay());

                Map<LocalDate, List<AnalyticsDto.CategoryFocusTime>> dailyCatMap = aggregations.stream()
                                .collect(Collectors.groupingBy(
                                                FocusSessionRepository.DailyCategoryFocusProjection::getDate,
                                                Collectors.mapping(p -> new AnalyticsDto.CategoryFocusTime(
                                                                p.getCategoryId(),
                                                                p.getCategoryName(),
                                                                p.getCategoryColor(),
                                                                p.getMinutes()), Collectors.toList())));

                List<AnalyticsDto.DailyFocusByCategory> result = new ArrayList<>();
                String[] dayNames = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

                for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                        int goalMinutes = goalMap.getOrDefault(date, 0);
                        List<AnalyticsDto.CategoryFocusTime> categories = dailyCatMap.getOrDefault(date,
                                        new ArrayList<>());
                        categories.sort((a, b) -> a.categoryName().compareTo(b.categoryName()));

                        result.add(new AnalyticsDto.DailyFocusByCategory(date,
                                        dayNames[date.getDayOfWeek().getValue() % 7], goalMinutes, categories));
                }
                return result;
        }

        /**
         * Retrieves and groups task summaries for the specified range.
         * 
         * @return List of grouped task summaries (Completed, Incomplete).
         */
        public List<AnalyticsDto.GroupedTaskSummary> getTaskSummary(String userId, OffsetDateTime startDate,
                        OffsetDateTime endDate) {
                List<AnalyticsDto.TaskSummary> summaries = fetchAndBuildTaskSummaries(userId, startDate, endDate);
                return aggregator.groupTaskSummaries(summaries);
        }

        private List<AnalyticsDto.TaskSummary> fetchAndBuildTaskSummaries(String userId, OffsetDateTime start,
                        OffsetDateTime end) {
                List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(userId,
                                start.toLocalDateTime(), end.toLocalDateTime());
                List<Task> tasks = taskRepository.findByUserIdAndScheduledStartAtBetween(userId, start, end);
                int focusDuration = pomodoroSettingRepository.findByUserId(userId).map(s -> s.getFocusDuration())
                                .orElse(25);

                return aggregator.buildTaskSummaryList(sessions, tasks, focusDuration);
        }
}
