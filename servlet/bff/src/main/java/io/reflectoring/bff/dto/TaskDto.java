package io.reflectoring.bff.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

public class TaskDto {

    public record Create(String title, Long taskListId) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Update(String title, TaskStatus status) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Summary(Long id, String title, TaskStatus status, LocalDate dueDate, LocalDate executionDate,
            Long taskListId) {
    }

}
