package io.reflectoring.bff.dto;

import java.time.LocalDate;
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
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task status", example = "COMPLETED") TaskStatus status,
                        @Schema(description = "Execution date", example = "2023-12-24") LocalDate executionDate,
                        @Schema(description = "Category ID", example = "1") Long categoryId,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Completed at timestamp", example = "2023-12-24T10:00:00") java.time.LocalDateTime completedAt,
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros) {
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
                        @Schema(description = "Completed at timestamp") java.time.LocalDateTime completedAt) {
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

}
