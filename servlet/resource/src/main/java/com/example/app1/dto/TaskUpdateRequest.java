package com.example.app1.dto;

import com.example.app1.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request DTO for updating a task.
 * Only non-null fields will be updated.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskUpdateRequest(
        String title,
        TaskStatus status) {
}
