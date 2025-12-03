package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.reflectoring.bff.model.TaskStatus;

/**
 * Request DTO for patching a task.
 * Only non-null fields will be updated.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskPatchRequest(
                String title,
                TaskStatus status) {
}
