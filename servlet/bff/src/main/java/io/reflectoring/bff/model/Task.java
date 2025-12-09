package io.reflectoring.bff.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Task(
        Long id,
        String title,
        TaskStatus status,
        Long taskListId) {
}
