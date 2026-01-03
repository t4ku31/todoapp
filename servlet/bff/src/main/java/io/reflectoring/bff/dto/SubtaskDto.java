package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public class SubtaskDto {

    public record Create(String title, String description) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Update(String title, String description, Boolean isCompleted, Integer orderIndex) {
    }

    public record Summary(
            Long id,
            Long taskId,
            String title,
            String description,
            boolean isCompleted,
            Integer orderIndex) {
    }
}
