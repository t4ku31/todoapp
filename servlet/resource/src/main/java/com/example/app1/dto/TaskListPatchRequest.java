package com.example.app1.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskListPatchRequest {
    private String title;
    private LocalDate dueDate;
    private Boolean isCompleted;
}
