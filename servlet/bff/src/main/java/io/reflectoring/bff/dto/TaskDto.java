package io.reflectoring.bff.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class TaskDto {

    @Schema(name = "TaskCreate")
    public record Create(String title, Long taskListId) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(name = "TaskUpdate")
    public record Update(String title, TaskStatus status) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Schema(name = "TaskSummary")
    public record Summary(Long id, String title, TaskStatus status, LocalDate dueDate, LocalDate executionDate,
            Long taskListId) {
    }

}
