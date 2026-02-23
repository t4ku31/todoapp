package com.example.app1.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class TaskListDto {

    @Schema(name = "TaskListCreate")
    public record Create(String title, LocalDate dueDate, List<TaskDto.Create> tasks) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(name = "TaskListUpdate")
    public record Update(String title, LocalDate dueDate, Boolean isCompleted) {
    }
}
