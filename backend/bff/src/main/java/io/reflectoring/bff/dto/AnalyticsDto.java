package io.reflectoring.bff.dto;

import java.time.LocalDate;
import java.util.List;

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
                private java.util.Map<String, List<CategoryFocusTime>> categoryAggregation;
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

        public record DailyGoalWithActual(
                        LocalDate date,
                        Integer goalMinutes,
                        Integer actualMinutes,
                        Double percentageComplete) {
        }

        public record EfficiencyStats(
                        LocalDate date,
                        double efficiencyScore,
                        double rhythmQuality,
                        double volumeBalance,
                        double focusRatio,
                        double restRatio,
                        double paceRatio) {
        }

        public record CategoryFocusTime(
                        Long categoryId,
                        String categoryName,
                        String categoryColor,
                        Integer minutes) {
        }

        public record DailyFocusByCategory(
                        LocalDate date,
                        String dayOfWeek,
                        Integer goalMinutes,
                        List<CategoryFocusTime> categories) {
        }

        public record WeeklyCategoryAggregation(
                        LocalDate startDate,
                        LocalDate endDate,
                        Integer totalMinutes,
                        List<CategoryFocusTime> categories) {
        }

        public record DayActivity(
                        String date,
                        long minutes) {
        }

        public record TaskSummary(
                        Long taskId,
                        String taskTitle,
                        String categoryName,
                        String categoryColor,
                        String status,
                        boolean isCompleted,
                        int focusMinutes,
                        Integer estimatedMinutes,
                        int progressPercentage,
                        Long parentTaskId,
                        LocalDate startDate) {
        }

        public record GroupedTaskSummary(
                        Long parentTaskId,
                        String title,
                        String categoryName,
                        String categoryColor,
                        int totalFocusMinutes,
                        int completedCount,
                        int totalCount,
                        boolean isRecurring,
                        List<TaskSummary> children) {
        }
}
