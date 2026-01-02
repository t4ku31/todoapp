package io.reflectoring.bff.dto;

import java.time.LocalDate;

public class AnalyticsDto {

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
                        java.util.List<CategoryFocusTime> categories) {
        }

        public record WeeklyCategoryAggregation(
                        LocalDate startDate,
                        LocalDate endDate,
                        Integer totalMinutes,
                        java.util.List<CategoryFocusTime> categories) {
        }

        public record WeeklyTaskFocus(
                        Long taskId,
                        String taskName,
                        String status,
                        double actualHours,
                        double estimatedHours,
                        int progressPercentage,
                        boolean isCompleted) {
        }

        public record DailyTaskSummary(
                        Long taskId,
                        String taskTitle,
                        String categoryName,
                        String categoryColor,
                        boolean completed,
                        int focusMinutes) {
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
                        int progressPercentage) {
        }
}
