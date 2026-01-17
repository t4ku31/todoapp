package io.reflectoring.bff.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Daily Analytics page data.
 * Consolidates all data needed for the Daily view into a single response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAnalyticsDto {

    // Date
    private LocalDate date;

    // Efficiency Stats
    private double efficiencyScore;
    private double rhythmQuality;
    private double volumeBalance;
    private double focusRatio;
    private double restRatio;
    private double paceRatio;

    // Estimation Stats
    private int totalEstimatedMinutes;
    private int totalActualMinutes;
    private int estimationDifferenceMinutes;
    private int tasksCompletedCount;
    private int tasksTotalCount;

    // Task Summaries (flat list for daily view - no grouping needed)
    private List<TaskSummaryData> taskSummaries;

    // Focus Sessions (for timeline and hourly chart)
    private List<FocusSessionData> focusSessions;

    /**
     * Task summary data for daily view (flat, no grouping).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskSummaryData {
        private Long taskId;
        private String taskTitle;
        private String categoryName;
        private String categoryColor;
        private String status;
        private boolean isCompleted;
        private int focusMinutes;
        private Integer estimatedMinutes;
        private int progressPercentage;
    }

    /**
     * Focus session data for timeline.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FocusSessionData {
        private Long id;
        private Long taskId;
        private String taskTitle;
        private String categoryName;
        private String categoryColor;
        private String sessionType;
        private String status;
        private int scheduledDuration; // seconds
        private int actualDuration; // seconds
        private String startedAt;
        private String endedAt;
    }
}
