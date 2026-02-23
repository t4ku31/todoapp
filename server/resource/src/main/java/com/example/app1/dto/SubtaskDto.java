package com.example.app1.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class SubtaskDto {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(name = "SubtaskCreate")
    public record Create(Long taskId, String title, String description, Boolean isCompleted, Integer orderIndex) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(name = "SubtaskUpdate")
    public record Update(String title, String description, Boolean isCompleted, Integer orderIndex) {
    }

    @Schema(name = "SubtaskSummary")
    public record Summary(
            Long id,
            Long taskId,
            String title,
            String description,
            Boolean isCompleted,
            Integer orderIndex) {
    }
}
