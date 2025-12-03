package com.example.app1.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class TaskListCreateRequest {
    private String title;
    private LocalDate dueDate;
    private List<TaskCreateRequest> tasks;
}