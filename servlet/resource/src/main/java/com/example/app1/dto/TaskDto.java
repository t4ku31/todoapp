package com.example.app1.dto;

import java.time.LocalDate;

import com.example.app1.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class TaskDto {

        @Schema(name = "TaskCreate")
        public record Create(String title, Long taskListId, LocalDate executionDate,
                        Long categoryId, Integer estimatedDuration) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(String title, TaskStatus status, LocalDate executionDate,
                        Long categoryId, Long taskListId, Integer estimatedDuration,
                        java.time.LocalDateTime completedAt) {
        }

        /**
         * Task statistics response
         */
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(name = "TaskStats")
        public static class Stats {
                private LocalDate startDate;
                private LocalDate endDate;
                private Long completedCount;
                private Long totalCount;
                private Integer totalEstimatedMinutes;
                private Integer totalActualMinutes;
        }
}
