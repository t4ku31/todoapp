package com.example.app1.dto;

import com.example.app1.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

public class TaskDto {

    public record Create(String title, Long taskListId) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Update(String title, TaskStatus status) {
    }
}
