package com.todoapp.resource.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTOs for Analytics API.
 */
public class AnalyticsDto {

        public record KpiData(
                        long totalFocusMinutes,
                        int tasksCompletedCount,
                        int tasksTotalCount,
                        double efficiencyScore,
                        double rhythmQuality,
                        double volumeBalance,
                        double focusComparisonDiffMinutes,
                        double taskCompletionRateGrowth,
                        int totalEstimatedMinutes,
                        int totalActualMinutes) {
        }

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class MonthlyAnalyticsDto {
                private KpiData kpi;
                private int focusDays;
                private double dailyAverageFocusMinutes;
                private List<DayActivity> dailyActivity;
                private Map<String, List<CategoryFocusTime>> categoryAggregation;

                @lombok.Data
                @lombok.NoArgsConstructor
                @lombok.AllArgsConstructor
                public static class DayActivity {
                        private String date;
                        private long minutes;
                }
        }

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class WeeklyAnalyticsDto {
                private KpiData kpi;
                private double dailyAverageFocusMinutes;
                private List<DailyFocusByCategory> dailyFocusData;
                private List<CategoryFocusTime> categoryAggregation;
                private List<GroupedTaskSummary> taskSummaries;
        }

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class DailyAnalyticsDto {
                private KpiData kpi;
                private List<TaskSummary> taskSummaries;
                private List<FocusSessionData> focusSessions;

                @lombok.Data
                @lombok.Builder
                @lombok.NoArgsConstructor
                @lombok.AllArgsConstructor
                public static class FocusSessionData {
                        private Long id;
                        private Long taskId;
                        private String taskTitle;
                        private String categoryName;
                        private String categoryColor;
                        private String sessionType;
                        private String status;
                        private int scheduledDuration;
                        private int actualDuration;
                        private String startedAt;
                        private String endedAt;
                }
        }

        /**
         * Response DTO for daily goal with actual focus time.
         */
        public record DailyGoalWithActual(
                        LocalDate date,
                        Integer goalMinutes,
                        Integer actualMinutes,
                        Double percentageComplete) {
        }

        /**
         * Response DTO for efficiency stats.
         */
        @lombok.Builder
        public record EfficiencyStats(
                        LocalDate date,
                        double efficiencyScore,
                        double rhythmQuality,
                        double volumeBalance) {
        }

        /**
         * Focus time per category.
         */
        public record CategoryFocusTime(
                        Long categoryId,
                        String categoryName,
                        String categoryColor,
                        Integer minutes) {
        }

        /**
         * Daily focus breakdown by category.
         */
        public record DailyFocusByCategory(
                        LocalDate date,
                        String dayOfWeek,
                        Integer goalMinutes,
                        List<CategoryFocusTime> categories) {
        }

        /**
         * Weekly category aggregation for pie chart.
         */
        public record WeeklyCategoryAggregation(
                        LocalDate startDate,
                        LocalDate endDate,
                        Integer totalMinutes,
                        List<CategoryFocusTime> categories) {
        }

        /**
         * Unified Task Summary DTO for both Daily and Weekly views.
         */
        public record TaskSummary(
                        Long taskId,
                        String taskTitle,
                        String categoryName,
                        String categoryColor,
                        String status,
                        @JsonProperty("completed") boolean completed,
                        int focusMinutes, // Actual duration in the specified range
                        Integer estimatedMinutes,
                        int progressPercentage,
                        Long parentTaskId, // For recurring tasks, links to the parent
                        LocalDate startDate) { // Date this task instance is for
        }

        /**
         * Grouped Task Summary for recurring tasks.
         * Aggregates multiple child task instances into a single group.
         */
        public record GroupedTaskSummary(
                        Long parentTaskId, // Grouping key (parent ID or self ID for non-recurring)
                        String title,
                        String categoryName,
                        String categoryColor,
                        int totalFocusMinutes, // Sum of all children's focus time
                        int completedCount, // Number of completed child tasks
                        int totalCount, // Total number of child tasks in range
                        @JsonProperty("recurring") boolean isRecurring, // True if this is a recurring task group
                        List<TaskSummary> children) { // Individual task instances for expansion
        }
}
