package com.example.app1.dto;

import java.time.LocalDate;

/**
 * DTOs for Analytics API.
 */
public class AnalyticsDto {

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
    public record EfficiencyStats(
            LocalDate date,
            double efficiencyScore,
            double rhythmQuality,
            double volumeBalance,
            double focusRatio,
            double restRatio,
            double paceRatio) {

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private LocalDate date;
            private double efficiencyScore;
            private double rhythmQuality;
            private double volumeBalance;
            private double focusRatio;
            private double restRatio;
            private double paceRatio;

            public Builder date(LocalDate date) {
                this.date = date;
                return this;
            }

            public Builder efficiencyScore(double efficiencyScore) {
                this.efficiencyScore = efficiencyScore;
                return this;
            }

            public Builder rhythmQuality(double rhythmQuality) {
                this.rhythmQuality = rhythmQuality;
                return this;
            }

            public Builder volumeBalance(double volumeBalance) {
                this.volumeBalance = volumeBalance;
                return this;
            }

            public Builder focusRatio(double focusRatio) {
                this.focusRatio = focusRatio;
                return this;
            }

            public Builder restRatio(double restRatio) {
                this.restRatio = restRatio;
                return this;
            }

            public Builder paceRatio(double paceRatio) {
                this.paceRatio = paceRatio;
                return this;
            }

            public EfficiencyStats build() {
                return new EfficiencyStats(date, efficiencyScore, rhythmQuality, volumeBalance, focusRatio, restRatio,
                        paceRatio);
            }
        }
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
            java.util.List<CategoryFocusTime> categories) {
    }

    /**
     * Weekly category aggregation for pie chart.
     */
    public record WeeklyCategoryAggregation(
            LocalDate startDate,
            LocalDate endDate,
            Integer totalMinutes,
            java.util.List<CategoryFocusTime> categories) {
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
            boolean isCompleted,
            int focusMinutes, // Actual duration in the specified range
            Integer estimatedMinutes,
            int progressPercentage) {
    }

    /**
     * Weekly focus task summary.
     */
    public record WeeklyTaskFocus(
            Long taskId,
            String taskName,
            String status,
            double actualHours,
            double estimatedHours,
            int progressPercentage,
            boolean isCompleted) {
    }

    /**
     * Daily task summary with completion status and focus time.
     */
    public record DailyTaskSummary(
            Long taskId,
            String taskTitle,
            String categoryName,
            String categoryColor,
            boolean completed,
            int focusMinutes) {
    }
}
