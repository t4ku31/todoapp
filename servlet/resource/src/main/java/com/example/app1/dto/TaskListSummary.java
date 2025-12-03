package com.example.app1.dto;

import java.time.LocalDate;
import java.util.List;

import com.example.app1.model.TaskStatus;

/**
 * Projection interface to fetch only necessary columns for TaskList and its
 * Tasks.
 */
public interface TaskListSummary {
    Long getId();

    String getTitle();

    @com.fasterxml.jackson.annotation.JsonProperty("due_date")
    LocalDate getDueDate();

    @com.fasterxml.jackson.annotation.JsonProperty("is_completed")
    Boolean getIsCompleted();

    List<TaskSummary> getTasks();

    interface TaskSummary {
        Long getId();

        String getTitle();

        TaskStatus getStatus();
    }
}
