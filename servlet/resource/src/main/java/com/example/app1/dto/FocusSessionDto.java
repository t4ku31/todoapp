package com.example.app1.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class FocusSessionDto {

    /**
     * Request DTO for creating or adding to a focus session
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddRequest {
        private Long taskId; // nullable
        private LocalDate date;
        private Integer durationSeconds;
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
        private LocalDate date;
        private Integer durationSeconds;
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
}
