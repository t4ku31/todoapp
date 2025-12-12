package io.reflectoring.bff.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

public class TaskListDto {

    public record Create(String title, LocalDate dueDate, List<TaskDto.Create> tasks) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Update(String title, LocalDate dueDate, Boolean isCompleted) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Summary(Long id, String title, LocalDate dueDate, Boolean isCompleted, List<TaskDto.Summary> tasks) {
    }

}
