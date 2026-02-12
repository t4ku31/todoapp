package com.example.app1.dto;

import java.time.LocalDate;
import java.util.List;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Weekly Analytics page data.
 * Consolidates all data needed for the Weekly view into a single response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyAnalyticsDto {

    // Date range
    private LocalDate startDate;
    private LocalDate endDate;

    // KPI: Total Focus Time
    private long totalFocusMinutes;
    private double dailyAverageFocusMinutes;
    private double focusComparisonPercentage; // vs previous week

    // KPI: Efficiency
    private double efficiencyScore;
    private double rhythmQuality;
    private double volumeBalance;

    // KPI: Tasks Completed
    private int tasksCompletedCount;
    private int tasksTotalCount;
    private double taskComparisonPercentage; // vs previous week

    // KPI: Estimation Accuracy
    private int totalEstimatedMinutes;
    private int totalActualMinutes;
    private int estimationDifferenceMinutes; // actual - estimated

    // Chart: Daily Focus by Category (for stacked bar chart)
    private List<DailyFocusData> dailyFocusData;

    // Chart: Category Aggregation (for pie chart)
    private List<CategoryData> categoryAggregation;

    // List: Grouped Task Summaries (recurring tasks grouped together)
    private List<GroupedTaskSummaryData> taskSummaries;

    /**
     * Daily focus data for stacked bar chart.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyFocusData {
        private LocalDate date;
        private String dayOfWeek;
        private int goalMinutes;
        private List<CategoryData> categories;
    }

    /**
     * Category data for charts.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryData {
        private Long categoryId;
        private String categoryName;
        private String categoryColor;
        private int minutes;
    }

    /**
     * Grouped task summary data (recurring tasks grouped).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupedTaskSummaryData {
        private Long parentTaskId; // Grouping key
        private String title;
        private String categoryName;
        private String categoryColor;
        private int totalFocusMinutes; // Sum of all children
        private int completedCount; // Number of completed children
        private int totalCount; // Total children in range
        private boolean isRecurring; // True if grouped recurring task
        private List<TaskSummaryChildData> children; // Individual task instances
    }

    /**
     * Individual task instance (child of grouped summary).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskSummaryChildData {
        private Long taskId;
        private String taskTitle;
        private String status;
        private boolean isCompleted;
        private int focusMinutes;
        private Integer estimatedMinutes;
        private int progressPercentage;
        private LocalDate startDate;
    }
}
