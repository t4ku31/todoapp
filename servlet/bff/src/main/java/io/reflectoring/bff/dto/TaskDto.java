package io.reflectoring.bff.dto;

import java.time.LocalDate;

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
                        @Schema(description = "Estimated duration in minutes", example = "30") Integer estimatedDuration) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task status", example = "COMPLETED") TaskStatus status,
                        @Schema(description = "Execution date", example = "2023-12-24") LocalDate executionDate,
                        @Schema(description = "Category ID", example = "1") Long categoryId,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Estimated duration in minutes", example = "30") Integer estimatedDuration,
                        @Schema(description = "Completed at timestamp", example = "2023-12-24T10:00:00") java.time.LocalDateTime completedAt) {
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
                        @Schema(description = "Estimated duration in minutes", example = "30") Integer estimatedDuration,
                        @Schema(description = "Completed at timestamp") java.time.LocalDateTime completedAt) {
        }

}
