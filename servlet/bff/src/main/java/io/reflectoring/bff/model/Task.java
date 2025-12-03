package io.reflectoring.bff.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Task(
        Long id,
        String title,
        String detail,
        TaskStatus status,
        LocalDateTime limit,
        Long taskListId) {
}
