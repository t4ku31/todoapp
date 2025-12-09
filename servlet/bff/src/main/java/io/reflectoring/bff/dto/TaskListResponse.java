package io.reflectoring.bff.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;
import lombok.Data;

/**
 * API response DTO for TaskList.
 */
@Data
@Builder
public class TaskListResponse {
    private Long id;
    private String title;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private List<TaskResponse> tasks;
}
