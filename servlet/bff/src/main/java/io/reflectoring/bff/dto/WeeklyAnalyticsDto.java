package io.reflectoring.bff.dto;

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

    // List: Task Summaries
    private List<TaskSummaryData> taskSummaries;

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
     * Task summary data.
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
}
