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
public class BffTaskListResponse {
    private Long id;
    private String title;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private List<TaskSummary> tasks;

    @Data
    @Builder
    public static class TaskSummary {
        private Long id;
        private String title;
        private String status;
    }
}
