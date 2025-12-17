package com.example.app1.dto;

import java.time.LocalDate;

import com.example.app1.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class TaskDto {

        @Schema(name = "TaskCreate")
        public record Create(String title, Long taskListId, LocalDate dueDate, LocalDate executionDate,
                        Long categoryId) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate")
        public record Update(String title, TaskStatus status, LocalDate dueDate, LocalDate executionDate,
                        Long categoryId, Long taskListId) {
        }
}
