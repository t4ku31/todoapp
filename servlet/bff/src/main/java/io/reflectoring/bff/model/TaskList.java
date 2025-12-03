package io.reflectoring.bff.model;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TaskList(
        Long id,
        String title,
        @JsonProperty("due_date") LocalDate dueDate,
        @JsonProperty("is_completed") Boolean isCompleted,
        List<Task> tasks) {
}
