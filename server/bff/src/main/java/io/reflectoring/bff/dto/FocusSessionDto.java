package io.reflectoring.bff.dto;

import java.time.LocalDate;

public class FocusSessionDto {

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class RecordRequest {
                private Long id; // Optional: For updating existing session
                private Long taskId; // nullable
                private String sessionType; // FOCUS, SHORT_BREAK, LONG_BREAK
                private String status; // COMPLETED, INTERRUPTED
                private Integer scheduledDuration;
                private Integer actualDuration;
                private java.time.LocalDateTime startedAt;
                private java.time.LocalDateTime endedAt;
        }

        public record EfficiencyStats(
                        Double efficiencyScore,
                        Double rhythmQuality,
                        Double volumeBalance,
                        Double focusRatio,
                        Double restRatio,
                        Double paceRatio) {
        }

        public record Response(
                        Long id,
                        Long taskId,
                        String taskTitle,
                        String categoryName,
                        String categoryColor,
                        String sessionType,
                        String status,
                        Integer scheduledDuration,
                        Integer actualDuration,
                        java.time.LocalDateTime startedAt,
                        java.time.LocalDateTime endedAt) {
        }

        public record DailySummary(
                        LocalDate date,
                        Integer totalSeconds) {
        }

        public record TotalSummary(
                        Integer totalSeconds) {
        }

        public record WeeklySummary(
                        LocalDate date,
                        Integer totalSeconds,
                        Integer gapSeconds) {
        }
}
