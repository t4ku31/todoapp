package io.reflectoring.bff.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request DTO for patching a task list.
 * Only non-null fields will be updated.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskListPatchRequest(
                String title,
                LocalDate dueDate,
                Boolean isCompleted) {

}
