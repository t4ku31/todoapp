package io.reflectoring.bff.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class TaskDto {

        @Schema(name = "TaskCreate")
        public record Create(
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Execution date", example = "2023-12-24") LocalDate executionDate,
                        @Schema(description = "Category ID", example = "1") Long categoryId,
                        @Schema(description = "Subtasks list") List<SubtaskDto.Create> subtasks,
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros,
                        @Schema(description = "Whether this is a recurring task") Boolean isRecurring,
                        @Schema(description = "Recurrence rule in JSON format") String recurrenceRule,
                        @Schema(description = "Custom dates for multi-select mode") List<LocalDate> customDates,
                        @Schema(description = "Scheduled start time") LocalDateTime scheduledStartAt,
                        @Schema(description = "Scheduled end time") LocalDateTime scheduledEndAt,
                        @Schema(description = "Whether this is an all-day event") Boolean isAllDay,
                        @Schema(description = "Task status", example = "PENDING") TaskStatus status) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task status", example = "COMPLETED") TaskStatus status,
                        @Schema(description = "Execution date", example = "2023-12-24") LocalDate executionDate,
                        @Schema(description = "Category ID", example = "1") Long categoryId,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Completed at timestamp", example = "2023-12-24T10:00:00") LocalDateTime completedAt,
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros,
                        @Schema(description = "Whether this is a recurring task") Boolean isRecurring,
                        @Schema(description = "Recurrence rule in JSON format") String recurrenceRule,
                        @Schema(description = "Task description/notes") String description,
                        @Schema(description = "Scheduled start time") LocalDateTime scheduledStartAt,
                        @Schema(description = "Scheduled end time") LocalDateTime scheduledEndAt,
                        @Schema(description = "Whether this is an all-day event") Boolean isAllDay) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "TaskSummary")
        public record Summary(
                        @Schema(description = "Task ID", example = "1") Long id,
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task status", example = "COMPLETED") TaskStatus status,
                        @Schema(description = "Execution date", example = "2023-12-24") LocalDate executionDate,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Category details") CategoryDto.Response category,
                        @Schema(description = "Subtasks list") List<SubtaskDto.Summary> subtasks,
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros,
                        @Schema(description = "Completed at timestamp") LocalDateTime completedAt,
                        @Schema(description = "Whether this is a recurring task") Boolean isRecurring,
                        @Schema(description = "Recurrence rule") String recurrenceRule,
                        @Schema(description = "Parent task ID for recurring instances") Long recurrenceParentId,
                        @Schema(description = "Whether the task is in the trash") Boolean isDeleted,
                        @Schema(description = "Task description/notes") String description,
                        @Schema(description = "Scheduled start time") LocalDateTime scheduledStartAt,
                        @Schema(description = "Scheduled end time") LocalDateTime scheduledEndAt,
                        @Schema(description = "Whether this is an all-day event") Boolean isAllDay) {
        }

        public record Entity(
                        Long id,
                        String userId,
                        String title,
                        LocalDate executionDate,
                        LocalDateTime completedAt,
                        Integer estimatedPomodoros,
                        LocalDate startDate,
                        LocalDate endDate,
                        LocalDateTime scheduledStartAt,
                        LocalDateTime scheduledEndAt,
                        Boolean isAllDay,
                        String description,
                        Boolean isRecurring,
                        String recurrenceRule,
                        Long recurrenceParentId,
                        Integer orderIndex,
                        TaskStatus status,
                        Boolean isDeleted,
                        LocalDateTime createdAt,
                        LocalDateTime updatedAt,
                        Long taskListId,
                        CategoryDto.Entity category,
                        List<SubtaskDto.Entity> subtasks) {
        }

        @Schema(name = "TaskStats")
        public record Stats(
                        @Schema(description = "Start date") LocalDate startDate,
                        @Schema(description = "End date") LocalDate endDate,
                        @Schema(description = "Completed tasks count") Long completedCount,
                        @Schema(description = "Total tasks count") Long totalCount,
                        @Schema(description = "Total estimated minutes") Integer totalEstimatedMinutes,
                        @Schema(description = "Total actual minutes") Integer totalActualMinutes) {
        }

        @Schema(name = "TaskBulkUpdate")
        public record BulkUpdate(
                        @Schema(description = "List of task IDs to update") List<Long> taskIds,
                        @Schema(description = "New status for all tasks") TaskStatus status,
                        @Schema(description = "New category ID for all tasks") Long categoryId,
                        @Schema(description = "New task list ID for all tasks") Long taskListId,
                        @Schema(description = "New execution date for all tasks") LocalDate executionDate) {
        }

        @Schema(name = "TaskBulkDelete")
        public record BulkDelete(
                        @Schema(description = "List of task IDs to delete") List<Long> taskIds) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "TaskBulkOperationResult")
        public record BulkOperationResult(
                        @Schema(description = "Number of successfully processed tasks") int successCount,
                        @Schema(description = "Number of failed tasks") int failedCount,
                        @Schema(description = "List of failed task details") List<FailedTask> failedTasks,
                        @Schema(description = "Whether the entire operation was successful") boolean allSucceeded,
                        @Schema(description = "Pre-formatted display messages for UI") List<String> displayMessages) {

                @JsonIgnoreProperties(ignoreUnknown = true)
                public record FailedTask(
                                @Schema(description = "Task ID that failed") Long taskId,
                                @Schema(description = "Reason for failure") String reason,
                                @Schema(description = "Error code: UNAUTHORIZED, NOT_FOUND, INVALID_REQUEST, DATABASE_ERROR") String errorCode,
                                @Schema(description = "Pre-formatted display message for UI") String displayMessage) {
                }
        }

        @Schema(name = "TaskBulkCreate")
        public record BulkCreate(
                        @Schema(description = "List of tasks to create") List<Create> tasks) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "TaskBulkCreateResult")
        public record BulkCreateResult(
                        @Schema(description = "Number of successfully created tasks") int successCount,
                        @Schema(description = "List of created task IDs") List<Long> createdTaskIds,
                        @Schema(description = "Whether all tasks were created successfully") boolean allSucceeded,
                        @Schema(description = "Error message if any") String errorMessage) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "SyncTaskDto")
        public record SyncTaskDto(
                        Object id,
                        String title,
                        String description,
                        String executionDate,
                        String scheduledStartAt,
                        String scheduledEndAt,
                        Boolean isAllDay,
                        Integer estimatedPomodoros,
                        String categoryName,
                        String taskListTitle,
                        Boolean isRecurring,
                        String recurrencePattern,
                        Boolean isDeleted,
                        List<SubtaskDto.Summary> subtasks,
                        TaskStatus status) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "SyncResult")
        public record SyncResult(
                        boolean success,
                        String message,
                        int createdCount,
                        int updatedCount,
                        int deletedCount) {
        }

}
