package com.example.app1.service.usecase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.app1.dto.AnalyticsDto;
import com.example.app1.dto.AnalyticsDto.EfficiencyStats;
import com.example.app1.dto.DailyGoalDto;
import com.example.app1.dto.MonthlyAnalyticsDto;
import com.example.app1.model.Category;
import com.example.app1.model.FocusSession;
import com.example.app1.model.Task;
import com.example.app1.model.TaskStatus;
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

    /**
     * Get goal with actual focus time for a specific date.
     */
    public AnalyticsDto.DailyGoalWithActual getDailyGoalWithActual(String userId, LocalDate date) {
        DailyGoalDto.Response goal = dailyGoalService.getGoal(userId, date);
        return createDailyGoalWithActual(userId, goal);
    }

    /**
     * Get weekly goals with actuals.
     */
    public List<AnalyticsDto.DailyGoalWithActual> getDailyGoalsWithActualInRange(String userId, LocalDate startDate,
            LocalDate endDate) {
        List<DailyGoalDto.Response> goals = dailyGoalService.getGoalsInRange(userId, startDate, endDate);
        return goals.stream()
                .map(goal -> createDailyGoalWithActual(userId, goal))
                .toList();
    }

    private AnalyticsDto.DailyGoalWithActual createDailyGoalWithActual(String userId, DailyGoalDto.Response goal) {
        Integer actualSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(userId,
                goal.date().atStartOfDay(), goal.date().plusDays(1).atStartOfDay());
        if (actualSeconds == null) {
            actualSeconds = 0;
        }
        Integer actualMinutes = actualSeconds / 60;
        Integer goalMinutes = goal.goalMinutes();

        double percentage = goalMinutes > 0 ? (actualMinutes * 100.0 / goalMinutes) : 0;

        return new AnalyticsDto.DailyGoalWithActual(goal.date(), goalMinutes, actualMinutes, percentage);
    }

    /**
     * Get Efficiency Stats for a specific date (Daily).
     */
    /**
     * Get Efficiency Stats for a date range (Aggregated).
     */
    public AnalyticsDto.EfficiencyStats getEfficiencyStats(String userId, LocalDate startDate,
            LocalDate endDate) {
        log.info("Calculating efficiency stats for user {} from {} to {}", userId, startDate, endDate);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        // 1. Rhythm Quality (Range)
        Long completedCount = focusSessionRepository.countCompletedSessions(userId, start, end);
        Long totalCount = focusSessionRepository.countTotalSessions(userId, start, end);
        log.debug("Session counts: completed={}, total={}", completedCount, totalCount);

        double rhythmQuality = 0.0;
        if (totalCount != null && totalCount > 0) {
            rhythmQuality = (double) completedCount / totalCount * 100.0;
        }

        // 2. Volume Balance (Range)
        Integer totalFocusSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(userId, start,
                end);
        if (totalFocusSeconds == null) {
            totalFocusSeconds = 0;
        }
        int actualMinutes = totalFocusSeconds / 60;

        // Get goals for the range
        // For a single day, this returns a list of 1.
        List<DailyGoalDto.Response> goals = dailyGoalService.getGoalsInRange(userId, startDate, endDate);
        int goalMinutes = goals.stream().mapToInt(DailyGoalDto.Response::goalMinutes).sum();

        log.debug("Volume data: actualMinutes={}, goalMinutes={}", actualMinutes, goalMinutes);

        double volumeBalance = 0.0;
        if (goalMinutes > 0) {
            double achievement = (double) actualMinutes / goalMinutes * 100.0;
            if (achievement <= 100.0) {
                volumeBalance = achievement;
            } else {
                // Penalize overwork
                volumeBalance = Math.max(0, 200.0 - achievement);
            }
        }

        // Final Score (Average of 2 metrics)
        double efficiencyScore = (rhythmQuality + volumeBalance) / 2.0;

        // Determine date to return: if range is single day, return that day, else null
        // or maybe start?
        // Let's return startDate just to have a anchor, or null if range > 1 day?
        // Actually, if startDate == endDate, it's that day.
        LocalDate date = startDate.equals(endDate) ? startDate : null;

        log.info("Calculated stats: efficiency={}, rhythm={}, volume={}", efficiencyScore, rhythmQuality,
                volumeBalance);

        return AnalyticsDto.EfficiencyStats.builder()
                .date(date)
                .efficiencyScore(efficiencyScore)
                .rhythmQuality(rhythmQuality)
                .volumeBalance(volumeBalance)
                .focusRatio(achievementToRatio(volumeBalance))
                .restRatio(0.0)
                .paceRatio(0.0)
                .paceRatio(0.0)
                .build();
    }

    private Double achievementToRatio(double val) {
        return val;
    }

    /**
     * Get weekly focus breakdown by category for stacked bar chart.
     */
    public List<AnalyticsDto.DailyFocusByCategory> getDailyFocusByCategory(String userId, LocalDate startDate,
            LocalDate endDate) {
        log.info("Getting weekly focus by category for user {} from {} to {}", userId, startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        // Fetch all focus sessions with task and category
        List<com.example.app1.model.FocusSession> sessions = focusSessionRepository
                .findByUserIdAndStartedAtBetweenWithTask(userId, start, end);

        log.debug("Found focus sessions: {}", sessions);

        // Group sessions by date
        java.util.Map<LocalDate, List<FocusSession>> sessionsByDate = new java.util.HashMap<>();
        for (FocusSession session : sessions) {
            LocalDate sessionDate = session.getStartedAt().toLocalDate();
            sessionsByDate.computeIfAbsent(sessionDate, k -> new java.util.ArrayList<>()).add(session);
        }
        // Build response for each day in range
        List<AnalyticsDto.DailyFocusByCategory> result = new java.util.ArrayList<>();
        String[] dayNames = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyGoalDto.Response goal = dailyGoalService.getGoal(userId, date);
            // goal = {date:{id,goalMinutes}}
            List<AnalyticsDto.CategoryFocusTime> categories = new java.util.ArrayList<>();
            // categories = [{categoryId,categoryName,categoryColor,totalSeconds}]

            List<FocusSession> dateSessions = sessionsByDate.get(date);
            if (dateSessions != null && !dateSessions.isEmpty()) {
                Map<String, CategoryAggregation> categoryMap = aggregateFocusSessionsByCategory(dateSessions);
                for (CategoryAggregation agg : categoryMap.values()) {
                    categories.add(new AnalyticsDto.CategoryFocusTime(
                            agg.categoryId,
                            agg.categoryName,
                            agg.categoryColor,
                            agg.totalSeconds / 60 // Convert to minutes
                    ));
                }
            }

            // Sort by category name for consistent ordering
            categories.sort((a, b) -> a.categoryName().compareTo(b.categoryName()));

            result.add(new AnalyticsDto.DailyFocusByCategory(
                    date,
                    dayNames[date.getDayOfWeek().getValue() % 7],
                    goal.goalMinutes(),
                    categories));
        }

        return result;
    }

    /**
     * Get weekly category aggregation for pie chart.
     * Aggregates all focus sessions in the date range by category.
     */
    public AnalyticsDto.WeeklyCategoryAggregation getCategoryAggregation(String userId, LocalDate startDate,
            LocalDate endDate) {
        log.info("Getting weekly category aggregation for user {} from {} to {}", userId, startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        // Fetch all focus sessions with task and category
        List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(userId, start,
                end);

        // Use common aggregation method
        java.util.Map<String, CategoryAggregation> categoryMap = aggregateFocusSessionsByCategory(sessions);

        // Build category list
        List<AnalyticsDto.CategoryFocusTime> categories = new java.util.ArrayList<>();
        int totalSeconds = 0;

        for (CategoryAggregation agg : categoryMap.values()) {
            categories.add(new AnalyticsDto.CategoryFocusTime(
                    agg.categoryId,
                    agg.categoryName,
                    agg.categoryColor,
                    agg.totalSeconds / 60));
            totalSeconds += agg.totalSeconds;
        }

        // Sort by minutes descending
        categories.sort((a, b) -> b.minutes().compareTo(a.minutes()));

        return new AnalyticsDto.WeeklyCategoryAggregation(startDate, endDate, totalSeconds / 60, categories);
    }

    /**
     * Aggregate focus sessions by category.
     * Returns a map of categoryName to CategoryAggregation.
     */
    private java.util.Map<String, CategoryAggregation> aggregateFocusSessionsByCategory(List<FocusSession> sessions) {
        java.util.Map<String, CategoryAggregation> categoryMap = new java.util.HashMap<>();

        for (FocusSession session : sessions) {
            Long categoryId = -1L;
            String categoryName = "その他";
            String categoryColor = "#94a3b8";

            if (session.getTask() != null && session.getTask().getCategory() != null) {
                Category cat = session.getTask().getCategory();
                categoryId = cat.getId();
                categoryName = cat.getName();
                categoryColor = cat.getColor();
            }

            Long finalCategoryId = categoryId;
            String finalCategoryName = categoryName;
            String finalCategoryColor = categoryColor;

            categoryMap.compute(categoryName, (name, existingAgg) -> {
                if (existingAgg == null) {
                    return new CategoryAggregation(finalCategoryId, finalCategoryName, finalCategoryColor,
                            session.getActualDuration());
                } else {
                    existingAgg.addDuration(session.getActualDuration());
                    // If the existing aggregation was "virtual" (ID -1) but we found a real
                    // category (ID != -1),
                    // adopt the real category details.
                    if (existingAgg.categoryId == -1L && finalCategoryId != -1L) {
                        existingAgg.categoryId = finalCategoryId;
                        existingAgg.categoryColor = finalCategoryColor;
                    }
                    return existingAgg;
                }
            });
        }

        return categoryMap;
    }

    // Helper class for aggregation
    private static class CategoryAggregation {
        Long categoryId;
        String categoryName;
        String categoryColor;
        int totalSeconds;

        CategoryAggregation(Long categoryId, String categoryName, String categoryColor, int seconds) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.categoryColor = categoryColor;
            this.totalSeconds = seconds;
        }

        void addDuration(int seconds) {
            this.totalSeconds += seconds;
        }
    }

    /**
     * Get task summary for a specific date range.
     * Integrates logic from DailyTaskSummary and WeeklyFocusTasks.
     */
    public List<AnalyticsDto.GroupedTaskSummary> getTaskSummary(String userId, LocalDate startDate, LocalDate endDate) {
        // Build flat TaskSummary list using common method
        List<AnalyticsDto.TaskSummary> allTaskSummaries = buildTaskSummaryList(userId, startDate, endDate);

        // Group by parentTaskId (or self ID if no parent)
        Map<Long, GroupingAccumulator> groupedMap = new java.util.LinkedHashMap<>();

        for (AnalyticsDto.TaskSummary ts : allTaskSummaries) {
            // Determine grouping key: use parentTaskId if exists, otherwise use taskId
            Long groupKey = ts.parentTaskId() != null ? ts.parentTaskId() : ts.taskId();
            boolean isRecurring = ts.parentTaskId() != null;

            if (groupedMap.containsKey(groupKey)) {
                GroupingAccumulator acc = groupedMap.get(groupKey);
                acc.addChild(ts);
            } else {
                GroupingAccumulator acc = new GroupingAccumulator(
                        groupKey,
                        ts.taskTitle(),
                        ts.categoryName(),
                        ts.categoryColor(),
                        isRecurring);
                acc.addChild(ts);
                groupedMap.put(groupKey, acc);
            }
        }

        // Convert to GroupedTaskSummary list
        List<AnalyticsDto.GroupedTaskSummary> result = new java.util.ArrayList<>();
        for (GroupingAccumulator acc : groupedMap.values()) {
            result.add(acc.toGroupedTaskSummary());
        }

        // Sort by total focus time descending
        result.sort((a, b) -> Integer.compare(b.totalFocusMinutes(), a.totalFocusMinutes()));

        return result;
    }

    /**
     * Build a flat list of TaskSummary for a specific date range.
     * This is the common logic used by both Daily (flat) and Weekly (grouped)
     * analytics.
     * 
     * @param userId    User ID
     * @param startDate Start date (inclusive)
     * @param endDate   End date (inclusive)
     * @return List of TaskSummary (flat, not grouped)
     */
    private List<AnalyticsDto.TaskSummary> buildTaskSummaryList(String userId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        // Fetch focus sessions for calculation
        List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(userId, start,
                end);

        Map<Long, Integer> taskFocusSeconds = new java.util.HashMap<>();
        for (FocusSession session : sessions) {
            if (session.getTask() != null) {
                taskFocusSeconds.merge(session.getTask().getId(), session.getActualDuration(), Integer::sum);
            }
        }

        List<Task> tasksToProcess = taskRepository.findByUserIdAndScheduledStartAtDateBetween(userId, startDate,
                endDate);

        // Get pomodoro focus duration setting
        int focusDuration = pomodoroSettingRepository.findByUserId(userId)
                .map(s -> s.getFocusDuration())
                .orElse(25);

        // Build TaskSummary list
        List<AnalyticsDto.TaskSummary> result = new java.util.ArrayList<>();
        for (Task task : tasksToProcess) {
            String categoryName = "Others";
            String categoryColor = "#94a3b8";
            if (task.getCategory() != null) {
                categoryName = task.getCategory().getName();
                categoryColor = task.getCategory().getColor();
            }

            int focusSeconds = taskFocusSeconds.getOrDefault(task.getId(), 0);
            int focusMinutes = focusSeconds / 60;

            Integer estimatedMinutes = task.getEstimatedPomodoros() != null
                    ? task.getEstimatedPomodoros() * focusDuration
                    : 0;

            int progress = 0;
            if (estimatedMinutes != null && estimatedMinutes > 0) {
                progress = (int) ((focusMinutes * 100.0) / estimatedMinutes);
            } else if (TaskStatus.COMPLETED.equals(task.getStatus())) {
                progress = 100;
            }

            result.add(new AnalyticsDto.TaskSummary(
                    task.getId(),
                    task.getTitle(),
                    categoryName,
                    categoryColor,
                    task.getStatus().name(),
                    TaskStatus.COMPLETED.equals(task.getStatus()),
                    focusMinutes,
                    estimatedMinutes,
                    progress,
                    task.getRecurrenceParentId(),
                    task.getScheduledStartAt() != null ? task.getScheduledStartAt().toLocalDate() : null));
        }

        return result;
    }

    // Helper class for grouping accumulation
    private static class GroupingAccumulator {
        Long parentTaskId;
        String title;
        String categoryName;
        String categoryColor;
        boolean isRecurring;
        int totalFocusMinutes = 0;
        int completedCount = 0;
        int totalCount = 0;
        List<AnalyticsDto.TaskSummary> children = new java.util.ArrayList<>();

        GroupingAccumulator(Long parentTaskId, String title, String categoryName, String categoryColor,
                boolean isRecurring) {
            this.parentTaskId = parentTaskId;
            this.title = title;
            this.categoryName = categoryName;
            this.categoryColor = categoryColor;
            this.isRecurring = isRecurring;
        }

        void addChild(AnalyticsDto.TaskSummary child) {
            children.add(child);
            totalFocusMinutes += child.focusMinutes();
            totalCount++;
            if (child.isCompleted()) {
                completedCount++;
            }
        }

        AnalyticsDto.GroupedTaskSummary toGroupedTaskSummary() {
            // Sort children by execution date
            children.sort((a, b) -> {
                if (a.startDate() == null && b.startDate() == null)
                    return 0;
                if (a.startDate() == null)
                    return 1;
                if (b.startDate() == null)
                    return -1;
                return a.startDate().compareTo(b.startDate());
            });
            return new AnalyticsDto.GroupedTaskSummary(
                    parentTaskId,
                    title,
                    categoryName,
                    categoryColor,
                    totalFocusMinutes,
                    completedCount,
                    totalCount,
                    isRecurring,
                    children);
        }
    }

    /**
     * Get monthly analytics data including KPIs, heatmap data, and resource
     * allocation.
     */
    public MonthlyAnalyticsDto getMonthlyAnalytics(String userId, int year, int month) {
        log.info("Getting monthly analytics for user {} for {}-{}", userId, year, month);

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());
        LocalDateTime start = startOfMonth.atStartOfDay();
        LocalDateTime end = endOfMonth.atTime(23, 59, 59);

        // Fetch all focus sessions for the month
        List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(userId, start,
                end);

        // 1. Calculate KPI metrics
        long totalFocusSeconds = 0;
        Set<LocalDate> focusDatesSet = new HashSet<>();
        for (FocusSession session : sessions) {
            totalFocusSeconds += session.getActualDuration();
            focusDatesSet.add(session.getStartedAt().toLocalDate());
        }
        long totalFocusMinutes = totalFocusSeconds / 60;
        int focusDays = focusDatesSet.size();
        double averageDailyFocusMinutes = focusDays > 0 ? (double) totalFocusMinutes / focusDays : 0;

        // Count completed tasks within the month
        int totalTasksCompleted = taskRepository.countByUserIdAndStatusAndUpdatedAtBetween(
                userId, TaskStatus.COMPLETED, start, end);

        // Average efficiency score (using existing method)
        EfficiencyStats efficiencyStats = getEfficiencyStats(userId, startOfMonth, endOfMonth);
        double averageEfficiencyScore = efficiencyStats.efficiencyScore();

        // 2. Build daily activity for heatmap
        Map<LocalDate, Long> dailyMinutesMap = new HashMap<>();
        for (FocusSession session : sessions) {
            LocalDate sessionDate = session.getStartedAt().toLocalDate();
            dailyMinutesMap.merge(sessionDate, (long) session.getActualDuration() / 60, Long::sum);
        }

        List<MonthlyAnalyticsDto.DayActivity> dailyActivity = new ArrayList<>();
        for (LocalDate date = startOfMonth; !date.isAfter(endOfMonth); date = date.plusDays(1)) {
            long minutes = dailyMinutesMap.getOrDefault(date, 0L);
            dailyActivity.add(new MonthlyAnalyticsDto.DayActivity(date.toString(), minutes));
        }

        // 3. Build category distribution by week
        Map<String, List<MonthlyAnalyticsDto.CategoryTime>> categoryDistribution = new LinkedHashMap<>();

        // Determine weeks within the month
        int weekNum = 1;
        LocalDate weekStart = startOfMonth;
        while (!weekStart.isAfter(endOfMonth)) {
            LocalDate weekEnd = weekStart.plusDays(6);
            if (weekEnd.isAfter(endOfMonth)) {
                weekEnd = endOfMonth;
            }

            String weekKey = "Week " + weekNum;
            List<FocusSession> weekSessions = new java.util.ArrayList<>();
            for (FocusSession session : sessions) {
                LocalDate sessionDate = session.getStartedAt().toLocalDate();
                if (!sessionDate.isBefore(weekStart) && !sessionDate.isAfter(weekEnd)) {
                    weekSessions.add(session);
                }
            }

            java.util.Map<String, CategoryAggregation> categoryMap = aggregateFocusSessionsByCategory(weekSessions);
            List<MonthlyAnalyticsDto.CategoryTime> weekCategories = new java.util.ArrayList<>();
            for (CategoryAggregation agg : categoryMap.values()) {
                weekCategories.add(new MonthlyAnalyticsDto.CategoryTime(
                        agg.categoryName, agg.categoryColor, agg.totalSeconds / 60));
            }
            // Sort by minutes descending
            weekCategories.sort((a, b) -> Long.compare(b.getMinutes(), a.getMinutes()));
            categoryDistribution.put(weekKey, weekCategories);

            weekStart = weekEnd.plusDays(1);
            weekNum++;
        }

        // Build and return DTO
        return MonthlyAnalyticsDto.builder()
                .totalFocusMinutes(totalFocusMinutes)
                .totalTasksCompleted(totalTasksCompleted)
                .focusDays(focusDays)
                .averageDailyFocusMinutes(averageDailyFocusMinutes)
                .averageEfficiencyScore(averageEfficiencyScore)
                .dailyActivity(dailyActivity)
                .categoryDistribution(categoryDistribution)
                .build();
    }

    /**
     * Get consolidated weekly analytics data for the Weekly view.
     */
    public com.example.app1.dto.WeeklyAnalyticsDto getWeeklyAnalytics(String userId, LocalDate startDate,
            LocalDate endDate) {
        log.info("Getting weekly analytics for user {} from {} to {}", userId, startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        // 1. Total Focus Time
        Integer totalSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(
                userId, startDateTime, endDateTime);
        long totalFocusMinutes = (totalSeconds != null ? totalSeconds : 0) / 60;

        // Calculate daily average
        long daysInRange = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        double dailyAverage = daysInRange > 0 ? (double) totalFocusMinutes / daysInRange : 0;

        // Previous week comparison
        LocalDate prevStart = startDate.minusWeeks(1);
        LocalDate prevEnd = endDate.minusWeeks(1);
        Integer prevTotalSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(
                userId, prevStart.atStartOfDay(), prevEnd.plusDays(1).atStartOfDay());
        long prevTotalMinutes = (prevTotalSeconds != null ? prevTotalSeconds : 0) / 60;
        double focusComparison = prevTotalMinutes > 0
                ? ((double) (totalFocusMinutes - prevTotalMinutes) / prevTotalMinutes) * 100
                : 0;

        // 2. Efficiency Stats
        EfficiencyStats efficiency = getEfficiencyStats(userId, startDate, endDate);

        // 3. Tasks Completed (using startDate range)
        Long tasksCompletedLong = taskRepository.countCompletedByUserIdAndScheduledStartAtDateBetween(
                userId, startDate, endDate);
        int tasksCompleted = tasksCompletedLong != null ? tasksCompletedLong.intValue() : 0;
        Long tasksTotalLong = taskRepository.countByUserIdAndScheduledStartAtDateBetween(userId, startDate, endDate);
        int tasksTotal = tasksTotalLong != null ? tasksTotalLong.intValue() : 0;

        // Previous week tasks comparison
        Long prevTasksCompletedLong = taskRepository.countCompletedByUserIdAndScheduledStartAtDateBetween(
                userId, prevStart, prevEnd);
        int prevTasksCompleted = prevTasksCompletedLong != null ? prevTasksCompletedLong.intValue() : 0;
        double taskComparison = prevTasksCompleted > 0
                ? ((double) (tasksCompleted - prevTasksCompleted) / prevTasksCompleted) * 100
                : 0;

        // 4. Estimation Stats
        int focusDuration = pomodoroSettingRepository.findByUserId(userId)
                .map(s -> s.getFocusDuration())
                .orElse(25);
        List<Task> completedTasks = taskRepository.findCompletedByUserIdAndScheduledStartAtDateBetween(
                userId, startDate, endDate);
        int totalEstimated = 0;
        int totalActual = 0;
        for (Task task : completedTasks) {
            if (task.getEstimatedPomodoros() != null) {
                totalEstimated += task.getEstimatedPomodoros() * focusDuration;
            }
            // Calculate actual from focus sessions for this task
        }
        // Get total actual from focus sessions
        Integer actualSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(
                userId, startDateTime, endDateTime);
        totalActual = (actualSeconds != null ? actualSeconds : 0) / 60;

        // 5. Daily Focus by Category (for stacked bar chart)
        List<AnalyticsDto.DailyFocusByCategory> dailyData = getDailyFocusByCategory(userId, startDate, endDate);
        List<com.example.app1.dto.WeeklyAnalyticsDto.DailyFocusData> dailyFocusData = new ArrayList<>();
        for (AnalyticsDto.DailyFocusByCategory daily : dailyData) {
            List<com.example.app1.dto.WeeklyAnalyticsDto.CategoryData> cats = new ArrayList<>();
            for (AnalyticsDto.CategoryFocusTime cat : daily.categories()) {
                cats.add(com.example.app1.dto.WeeklyAnalyticsDto.CategoryData.builder()
                        .categoryId(cat.categoryId())
                        .categoryName(cat.categoryName())
                        .categoryColor(cat.categoryColor())
                        .minutes(cat.minutes())
                        .build());
            }
            dailyFocusData.add(com.example.app1.dto.WeeklyAnalyticsDto.DailyFocusData.builder()
                    .date(daily.date())
                    .dayOfWeek(daily.dayOfWeek())
                    .goalMinutes(daily.goalMinutes())
                    .categories(cats)
                    .build());
        }

        // 6. Category Aggregation (for pie chart)
        AnalyticsDto.WeeklyCategoryAggregation aggData = getCategoryAggregation(userId, startDate, endDate);
        List<com.example.app1.dto.WeeklyAnalyticsDto.CategoryData> categoryAggregation = new ArrayList<>();
        for (AnalyticsDto.CategoryFocusTime cat : aggData.categories()) {
            categoryAggregation.add(com.example.app1.dto.WeeklyAnalyticsDto.CategoryData.builder()
                    .categoryId(cat.categoryId())
                    .categoryName(cat.categoryName())
                    .categoryColor(cat.categoryColor())
                    .minutes(cat.minutes())
                    .build());
        }

        // 7. Task Summaries (Grouped)
        List<AnalyticsDto.GroupedTaskSummary> groupedTaskList = getTaskSummary(userId, startDate, endDate);
        List<com.example.app1.dto.WeeklyAnalyticsDto.GroupedTaskSummaryData> taskSummaries = new ArrayList<>();
        for (AnalyticsDto.GroupedTaskSummary gts : groupedTaskList) {
            // Convert children
            List<com.example.app1.dto.WeeklyAnalyticsDto.TaskSummaryChildData> children = new ArrayList<>();
            for (AnalyticsDto.TaskSummary child : gts.children()) {
                children.add(com.example.app1.dto.WeeklyAnalyticsDto.TaskSummaryChildData.builder()
                        .taskId(child.taskId())
                        .taskTitle(child.taskTitle())
                        .status(child.status())
                        .isCompleted(child.isCompleted())
                        .focusMinutes(child.focusMinutes())
                        .estimatedMinutes(child.estimatedMinutes())
                        .progressPercentage(child.progressPercentage())
                        .startDate(child.startDate())
                        .build());
            }
            taskSummaries.add(com.example.app1.dto.WeeklyAnalyticsDto.GroupedTaskSummaryData.builder()
                    .parentTaskId(gts.parentTaskId())
                    .title(gts.title())
                    .categoryName(gts.categoryName())
                    .categoryColor(gts.categoryColor())
                    .totalFocusMinutes(gts.totalFocusMinutes())
                    .completedCount(gts.completedCount())
                    .totalCount(gts.totalCount())
                    .isRecurring(gts.isRecurring())
                    .children(children)
                    .build());
        }

        return com.example.app1.dto.WeeklyAnalyticsDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalFocusMinutes(totalFocusMinutes)
                .dailyAverageFocusMinutes(dailyAverage)
                .focusComparisonPercentage(focusComparison)
                .efficiencyScore(efficiency.efficiencyScore())
                .rhythmQuality(efficiency.rhythmQuality())
                .volumeBalance(efficiency.volumeBalance())
                .tasksCompletedCount(tasksCompleted)
                .tasksTotalCount(tasksTotal)
                .taskComparisonPercentage(taskComparison)
                .totalEstimatedMinutes(totalEstimated)
                .totalActualMinutes(totalActual)
                .estimationDifferenceMinutes(totalActual - totalEstimated)
                .dailyFocusData(dailyFocusData)
                .categoryAggregation(categoryAggregation)
                .taskSummaries(taskSummaries)
                .build();
    }

    /**
     * Get consolidated daily analytics data for the Daily view.
     */
    public com.example.app1.dto.DailyAnalyticsDto getDailyAnalytics(String userId, LocalDate date) {
        log.info("Getting daily analytics for user {} on {}", userId, date);

        LocalDateTime startDateTime = date.atStartOfDay();
        LocalDateTime endDateTime = date.plusDays(1).atStartOfDay();

        // 1. Efficiency Stats
        EfficiencyStats efficiency = getEfficiencyStats(userId, date, date);

        // 2. Estimation Stats (using startDate)
        int focusDuration = pomodoroSettingRepository.findByUserId(userId)
                .map(s -> s.getFocusDuration())
                .orElse(25);
        List<Task> tasks = taskRepository.findByUserIdAndScheduledStartAtDate(userId, date);
        int totalEstimated = 0;
        int tasksCompleted = 0;
        for (Task task : tasks) {
            if (task.getEstimatedPomodoros() != null) {
                totalEstimated += task.getEstimatedPomodoros() * focusDuration;
            }
            if (TaskStatus.COMPLETED.equals(task.getStatus())) {
                tasksCompleted++;
            }
        }
        int tasksTotal = tasks.size();

        // Get total actual from focus sessions
        Integer actualSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(
                userId, startDateTime, endDateTime);
        int totalActual = (actualSeconds != null ? actualSeconds : 0) / 60;

        // 3. Task Summaries (Flat list for daily - no grouping needed)
        // 3. Task Summaries (Flat list for daily - use shared logic)
        List<AnalyticsDto.TaskSummary> sharedSummaries = buildTaskSummaryList(userId, date, date);
        List<com.example.app1.dto.DailyAnalyticsDto.TaskSummaryData> taskSummaries = new ArrayList<>();

        for (AnalyticsDto.TaskSummary ts : sharedSummaries) {
            taskSummaries.add(com.example.app1.dto.DailyAnalyticsDto.TaskSummaryData.builder()
                    .taskId(ts.taskId())
                    .taskTitle(ts.taskTitle())
                    .categoryName(ts.categoryName())
                    .categoryColor(ts.categoryColor())
                    .status(ts.status())
                    .isCompleted(ts.isCompleted())
                    .focusMinutes(ts.focusMinutes())
                    .estimatedMinutes(ts.estimatedMinutes())
                    .progressPercentage(ts.progressPercentage())
                    .build());
        }

        // 4. Focus Sessions
        List<FocusSession> sessions = focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(
                userId, startDateTime, endDateTime);
        List<com.example.app1.dto.DailyAnalyticsDto.FocusSessionData> focusSessions = new ArrayList<>();
        for (FocusSession session : sessions) {
            Task task = session.getTask();
            Category category = task != null ? task.getCategory() : null;

            focusSessions.add(com.example.app1.dto.DailyAnalyticsDto.FocusSessionData.builder()
                    .id(session.getId())
                    .taskId(task != null ? task.getId() : null)
                    .taskTitle(task != null ? task.getTitle() : "Unknown Task")
                    .categoryName(category != null ? category.getName() : "Others")
                    .categoryColor(category != null ? category.getColor() : "#94a3b8")
                    .sessionType(session.getSessionType().name())
                    .status(session.getStatus().name())
                    .scheduledDuration(session.getScheduledDuration())
                    .actualDuration(session.getActualDuration())
                    .startedAt(session.getStartedAt().toString())
                    .endedAt(session.getEndedAt() != null ? session.getEndedAt().toString() : null)
                    .build());
        }

        return com.example.app1.dto.DailyAnalyticsDto.builder()
                .date(date)
                .efficiencyScore(efficiency.efficiencyScore())
                .rhythmQuality(efficiency.rhythmQuality())
                .volumeBalance(efficiency.volumeBalance())
                .focusRatio(efficiency.focusRatio())
                .restRatio(efficiency.restRatio())
                .paceRatio(efficiency.paceRatio())
                .totalEstimatedMinutes(totalEstimated)
                .totalActualMinutes(totalActual)
                .estimationDifferenceMinutes(totalActual - totalEstimated)
                .tasksCompletedCount(tasksCompleted)
                .tasksTotalCount(tasksTotal)
                .taskSummaries(taskSummaries)
                .focusSessions(focusSessions)
                .build();
    }
}
