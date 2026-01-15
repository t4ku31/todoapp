package com.example.app1.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
                        Long categoryId, List<SubtaskDto.Create> subtasks, Integer estimatedPomodoros,
                        Boolean isRecurring, String recurrenceRule, List<LocalDate> customDates,
                        LocalDateTime scheduledStartAt, LocalDateTime scheduledEndAt, Boolean isAllDay) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(String title, TaskStatus status, LocalDate executionDate,
                        Long categoryId, Long taskListId,
                        LocalDateTime completedAt,
                        Integer estimatedPomodoros,
                        Boolean isRecurring,
                        String recurrenceRule,
                        String description,
                        LocalDateTime scheduledStartAt, LocalDateTime scheduledEndAt, Boolean isAllDay) {
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

        /**
         * Bulk update request - update multiple tasks at once
         */
        @Schema(name = "TaskBulkUpdate")
        public record BulkUpdate(
                        List<Long> taskIds,
                        TaskStatus status,
                        Long categoryId,
                        Long taskListId,
                        LocalDate executionDate) {
        }

        /**
         * Bulk delete request - delete multiple tasks at once
         */
        @Schema(name = "TaskBulkDelete")
        public record BulkDelete(List<Long> taskIds) {
        }

        /**
         * Result of a bulk operation with partial success support
         */
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(name = "TaskBulkOperationResult")
        public static class BulkOperationResult {
                @Schema(description = "Number of successfully processed tasks")
                private int successCount;

                @Schema(description = "Number of failed tasks")
                private int failedCount;

                @Schema(description = "List of failed task details")
                private List<FailedTask> failedTasks;

                @Schema(description = "Whether the entire operation was successful")
                private boolean allSucceeded;

                @Schema(description = "Pre-formatted display messages for UI")
                private List<String> displayMessages;

                @Data
                @Builder
                @NoArgsConstructor
                @AllArgsConstructor
                public static class FailedTask {
                        @Schema(description = "Task ID that failed")
                        private Long taskId;

                        @Schema(description = "Reason for failure")
                        private String reason;

                        @Schema(description = "Error code: UNAUTHORIZED, NOT_FOUND, INVALID_REQUEST, DATABASE_ERROR")
                        private String errorCode;

                        @Schema(description = "Pre-formatted display message for UI")
                        private String displayMessage;
                }
        }
}
