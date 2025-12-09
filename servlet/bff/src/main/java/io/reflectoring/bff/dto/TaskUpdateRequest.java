package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.reflectoring.bff.model.TaskStatus;

/**
 * Request DTO for updating a task.
 * Only non-null fields will be updated.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskUpdateRequest(
        String title,
        TaskStatus status) {
}
