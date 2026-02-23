package com.todoapp.resource.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class FocusSessionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordRequest {
        private Long id; // Optional: For updating existing session
        private Long taskId; // nullable
        private String sessionType; // FOCUS, SHORT_BREAK, LONG_BREAK
        private String status; // COMPLETED, INTERRUPTED
        private Integer scheduledDuration;
        private Integer actualDuration;
        // Times handled by server or client? Client passes startedAt is safer for sync
        // issues?
        // Let's assume server generates startedAt/endedAt or client passes them.
        // Actually for simplicity, we can rely on creation time or pass simplified
        // params.
        // But for "Flow", we might record after the fact.
        // Let's accept timestamps if needed, but for MVP, server time is easier if
        // recorded immediately.
        // However, if we record *after* completion (which includes overtime), the start
        // time was 25+ mins ago.
        // So client SHOULD pass startedAt.
        private java.time.LocalDateTime startedAt;
        private java.time.LocalDateTime endedAt;
    }

    /**
     * Response DTO for focus session
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long taskId;
        private String taskTitle;
        private String categoryName;
        private String categoryColor;
        private String sessionType;
        private String status;
        private Integer scheduledDuration;
        private Integer actualDuration;
        private java.time.LocalDateTime startedAt;
        private java.time.LocalDateTime endedAt;
    }

    /**
     * Response DTO for daily summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySummary {
        private LocalDate date;
        private Integer totalSeconds;
    }

    /**
     * Response DTO for total summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TotalSummary {
        private Integer totalSeconds;
    }

    /**
     * Response DTO for weekly summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklySummary {
        private LocalDate date;
        private Integer totalSeconds;
        private Integer gapSeconds;
    }
}
