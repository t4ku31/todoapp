package io.reflectoring.bff.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Monthly Analytics data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAnalyticsDto {

    private long totalFocusMinutes;
    private int totalTasksCompleted;
    private int focusDays;
    private double averageDailyFocusMinutes;
    private double averageEfficiencyScore;
    private List<DayActivity> dailyActivity;
    private Map<String, List<CategoryTime>> categoryDistribution;

    /**
     * Represents daily focus activity for heatmap display.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayActivity {
        private String date;
        private long minutes;
    }

    /**
     * Represents focus time per category.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryTime {
        private String name;
        private String color;
        private long minutes;
    }
}
